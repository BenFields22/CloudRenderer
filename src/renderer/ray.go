package main

// Ray is a light ray with an origin, direction, and time.
type Ray struct {
	Or  Vec3
	Dir Vec3
	T   float64
}

// NewRay returns a new ray with an origin, direction, and point in time.
func NewRay(origin Vec3, direction Vec3, time float64) Ray {
	return Ray{
		Or:  origin,
		Dir: direction,
		T:   time,
	}
}

// At returns the position of the ray at distance d.
func (r Ray) At(d float64) Vec3 {
	return r.Or.Plus(r.Dir.Scaled(d))
}
