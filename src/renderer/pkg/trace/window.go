package trace

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io/ioutil"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strconv"

	"tracer/pkg/geom"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

const bias = 0.001

// Hitter represents something that can be Hit by a Ray.
type Hitter interface {
	Hit(r geom.Ray, tMin, tMax float64) (t float64, s Bouncer)
}

// Bouncer represents something that can return Bounce normals and materials
type Bouncer interface {
	Bounce(p geom.Vec) (n geom.Unit, m Material)
}

// Material represents a material that scatters light.
type Material interface {
	Scatter(in geom.Unit, n geom.Unit) (out geom.Unit, attenuation Color, ok bool)
}

// Window gathers the results of ray traces on a W x H grid.
type Window struct {
	W, H int
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

// NewWindow creates a new Window with specific dimensions
func NewWindow(width, height int) Window {
	return Window{W: width, H: height}
}

// WritePPM traces each pixel in the Window and writes the results to w in PPM format
func (wi Window) WritePNG(filename string, h Hitter, samples int, writeToFile int) error {

	from := geom.NewVec(13, 2, 3)
	at := geom.NewVec(0, 0, 0)
	focus := 10.0
	cam := NewCamera(from, at, geom.NewUnit(0, 1, 0), 20, float64(wi.W)/float64(wi.H), 0.1, focus)
	img := image.NewNRGBA(image.Rect(0, 0, wi.W, wi.H))
	fmt.Println("Rendering image of size " + strconv.Itoa(wi.W) + "x" + strconv.Itoa(wi.H))

	for y := wi.H - 1; y >= 0; y-- {
		fmt.Printf("\rScanlines remaining: " + strconv.Itoa(y) + " ")
		for x := 0; x < wi.W; x++ {
			c := NewColor(0, 0, 0)
			for s := 0; s < samples; s++ {
				u := (float64(x) + rand.Float64()) / float64(wi.W)
				v := (float64(y) + rand.Float64()) / float64(wi.H)
				r := cam.Ray(u, v)
				c = c.Plus(mycolor(r, h, 0))
			}
			c = c.Scaled(1 / float64(samples)).Gamma(2)
			ir := int(255.99 * c.R())
			ig := int(255.99 * c.G())
			ib := int(255.99 * c.B())
			img.Set(x, wi.H-y-1, color.NRGBA{
				R: uint8(ir),
				G: uint8(ig),
				B: uint8(ib),
				A: 255,
			})
		}
	}

	if writeToFile == 1 || writeToFile == 3 {
		var name = filename + ".png"
		f1, err := os.Create(name)
		check(err)
		if err := png.Encode(f1, img); err != nil {
			f1.Close()
			log.Fatal(err)
		}
		if err := f1.Close(); err != nil {
			log.Fatal(err)
		}
	}

	if writeToFile == 2 || writeToFile == 3 {
		var imgContents bytes.Buffer
		f := bufio.NewWriter(&imgContents)
		if err := png.Encode(f, img); err != nil {
			log.Fatal(err)
		}

		reader := bufio.NewReader(&imgContents)
		sess := session.Must(session.NewSessionWithOptions(session.Options{
			SharedConfigState: session.SharedConfigEnable,
		}))
		_, err := sess.Config.Credentials.Get()
		if err != nil {
			fmt.Printf("Unable to get credentials %v", err)
		}
		uploader := s3manager.NewUploader(sess)
		bucket := "raytracerompletejobs"
		filename := "public/" + filename + ".png"
		_, err = uploader.Upload(&s3manager.UploadInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(filename),
			// here you pass your reader
			// the aws sdk will manage all the memory and file reading for you
			Body: reader,
		})
		if err != nil {
			fmt.Printf("Unable to upload %q to %q, %v", filename, bucket, err)
		} else {
			fmt.Println("Successfully wrote file to S3")
		}

	}
	reportJobComplete(filename)
	return nil
}

func reportJobComplete(name string) {
	postBody, _ := json.Marshal(map[string]string{
		"Name": name,
	})
	responseBody := bytes.NewBuffer(postBody)
	resp, err := http.Post("http://manager-endpoint:8080/ReportFinishedJob", "application/json", responseBody)
	//Handle Error
	if err != nil {
		log.Fatalf("An Error Occured %v", err)
	}
	defer resp.Body.Close()
	//Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}
	sb := string(body)
	log.Printf(sb)
}

func mycolor(r geom.Ray, h Hitter, depth int) Color {
	if depth > 50 {
		return NewColor(0, 0, 0)
	}
	if t, b := h.Hit(r, bias, math.MaxFloat64); t > 0 {
		p := r.At(t)
		n, m := b.Bounce(p)
		scattered, attenuation, ok := m.Scatter(r.Dir, n)
		if !ok {
			return NewColor(0, 0, 0)
		}
		r2 := geom.NewRay(p, scattered)
		return mycolor(r2, h, depth+1).Times(attenuation)
	}
	t := 0.5 * (r.Dir.Y() + 1.0)
	white := NewColor(1, 1, 1).Scaled(1 - t)
	blue := NewColor(0.5, 0.7, 1).Scaled(t)
	return white.Plus(blue)
}
