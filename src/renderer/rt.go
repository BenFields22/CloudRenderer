//stopped at section 6. Surface Normals and Multiple Objects
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"

	"tracer/pkg/geom"
	"tracer/pkg/trace"
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
var activeJobName string

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func scene(r float64, g float64, b float64) trace.List {
	gray := trace.NewLambert(trace.NewColor(0.5, 0.5, 0.5))
	l := trace.NewList(
		trace.NewSphere(geom.NewVec(0, -1000, 0), 1000, gray),
		trace.NewSphere(geom.NewVec(2.8, 1, 3.0), 1, trace.NewMetal(trace.NewColor(0.7, 0.6, 0.5), 0)),
		trace.NewSphere(geom.NewVec(0, 1, 1), 1, trace.NewMetal(trace.NewColor(0.7, 0.6, 0.5), 0)),
		trace.NewSphere(geom.NewVec(4, 1, 0), 1, trace.NewLambert(trace.NewColor(r, g, b))),
	)
	return l
}

func mat() trace.Material {
	m := rand.Float64()
	if m < 0.8 {
		c := trace.NewColor(rand.Float64()*rand.Float64(), rand.Float64()*rand.Float64(), rand.Float64()*rand.Float64())
		return trace.NewLambert(c)
	}
	if m < 0.95 {
		c := trace.NewColor(0.5*(1+rand.Float64()), 0.5*(1+rand.Float64()), 0.5*(1+rand.Float64()))
		return trace.NewMetal(c, 0.5*rand.Float64())
	}
	return trace.NewDielectric(1.5)
}

func RunJob(filename string, rgbSphere trace.Color, writeToFile int) {
	status = 1
	activeJobName = filename
	var aspect_ratio float64 = 16.0 / 9.0

	var image_width int = 1200
	var image_height int = int(float64(image_width) / aspect_ratio)
	w := trace.NewWindow(image_width, image_height)
	if err := w.WritePNG(filename, scene(rgbSphere.R(), rgbSphere.G(), rgbSphere.B()), 100, writeToFile); err != nil {
		panic(err)
	}
	fmt.Println("\nDone")
	status = 0
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
		go RunJob(details.Name, trace.NewColor(details.R, details.G, details.B), details.W)
		fmt.Printf("Starting job with Name %s and sphere color (%f,%f,%f)\n", details.Name, details.R, details.G, details.B)
		fmt.Fprintf(w, "Job has started")

	})

	http.HandleFunc("/getStatus", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		var stat string

		if status == 0 {
			stat = "Not working on any jobs"
		} else {
			stat = "Working on a job with name " + activeJobName + "\n"
		}

		fmt.Fprintf(w, stat)
	})

	log.Fatal(http.ListenAndServe(":8081", nil))
}
