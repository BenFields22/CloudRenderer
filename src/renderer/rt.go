//stopped at section 6. Surface Normals and Multiple Objects
package main

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
	"net/http"
	"os"
	"strconv"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

type JobDetails struct {
	Name string  `json.Name`
	R    float64 `json.R`
	G    float64 `json.G`
	B    float64 `json.B`
	W    int     `json.W`
}

var lines_left int
var status int = 0

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func ray_color(r Ray, sphereColor Color) Color {
	if (hit_sphere(Vec3{0, 0, -1}, 0.5, r)) {
		return sphereColor
	}
	var unit_direction Vec3 = r.Dir.Unit()
	var t float64 = 0.5 * (unit_direction.Y() + 1.0)
	var C1 Color = Color{1.0, 1.0, 1.0}
	C2 := Color{0.5, 0.7, 1.0}
	C1 = C1.Scaled(1.0 - t)
	C2 = C2.Scaled(t)
	return C1.Plus(C2)
}

func hit_sphere(center Vec3, radius float64, r Ray) bool {
	var oc Vec3 = r.Or.Minus(center)
	var a float64 = r.Dir.Dot(r.Dir)
	var b float64 = oc.Dot(r.Dir) * 2.0
	var c float64 = oc.Dot(oc) - radius*radius
	var discriminant float64 = b*b - 4*a*c
	return (discriminant > 0)
}

func RunJob(filename string, rgbSphere Color, writeToFile int) {
	status = 1
	var aspect_ratio float64 = 16.0 / 9.0

	var image_width int = 3840
	var image_height int = int(float64(image_width) / aspect_ratio)
	img := image.NewNRGBA(image.Rect(0, 0, image_width, image_height))

	var viewport_height float64 = 2.0
	var viewport_width float64 = aspect_ratio * viewport_height
	var focal_length float64 = 1.0

	origin := Vec3{0, 0, 0}
	horizontal := Vec3{viewport_width, 0, 0}
	vertical := Vec3{0, viewport_height, 0}
	t1 := Vec3{0, 0, focal_length}
	vertDivBy2 := vertical.Div(2.0)
	horizDivby2 := horizontal.Div(2.0)
	lowerleftcorner := origin.Minus(horizDivby2).Minus(vertDivBy2).Minus(t1)

	fmt.Println("Rendering image of size " + strconv.Itoa(image_width) + "x" + strconv.Itoa(image_height))

	for j := image_height - 1; j >= 0; j-- {
		fmt.Printf("\rScanlines remaining: " + strconv.Itoa(j) + " ")
		lines_left = j
		for i := 0; i < image_width; i++ {
			var u float64 = float64(i) / float64(image_width-1)
			var v float64 = float64(j) / float64(image_height-1)
			horizTimesU := horizontal.Scaled(u)
			vertTimesV := vertical.Scaled(v)
			res := Vec3(lowerleftcorner.Plus(horizTimesU).Plus(vertTimesV).Minus(origin))
			var r Ray = NewRay(origin, res, 0)
			var pixel_color Color = ray_color(r, rgbSphere)
			var red, green, blue int = pixel_color.RGBInt()
			img.Set(i, image_height-j-1, color.NRGBA{
				R: uint8(red),
				G: uint8(green),
				B: uint8(blue),
				A: 255,
			})
		}
	}
	fmt.Println("\nDone")

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
		status = 2
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
	status = 0
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

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func main() {
	http.HandleFunc("/startJob", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		decoder := json.NewDecoder(r.Body)
		var details JobDetails
		err := decoder.Decode(&details)
		if err != nil {
			panic(err)
		}
		go RunJob(details.Name, Color{details.R, details.G, details.B}, details.W)
		fmt.Printf("Starting job with Name %s and sphere color (%f,%f,%f)\n", details.Name, details.R, details.G, details.B)
		fmt.Fprintf(w, "Job has started")

	})

	http.HandleFunc("/getStatus", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		var stat string

		if status == 0 {
			stat = "Not working on any jobs"
		} else if status == 2 {
			stat = "Render complete. Writing to S3."
		} else {
			stat = "Working on job with " + strconv.Itoa(lines_left) + " lines left to go"
		}

		fmt.Fprintf(w, stat)
	})

	log.Fatal(http.ListenAndServe(":8081", nil))
}
