package main

import (
	"math"
)

type Vec3 [3]float64

func (V Vec3) X() float64 {
	return V[0]
}

func (V Vec3) Y() float64 {
	return V[1]
}

func (V Vec3) Z() float64 {
	return V[2]
}

// LenSq returns the square of the vector's length.
func (v Vec3) LenSq() float64 {
	return v[0]*v[0] + v[1]*v[1] + v[2]*v[2]
}

// Unit returns a projected unit vector.
func (v Vec3) Unit() (u Vec3) {
	k := 1.0 / v.Len()
	u[0] = v[0] * k
	u[1] = v[1] * k
	u[2] = v[2] * k
	return
}

// Plus returns the sum of this vector and v2.
func (v Vec3) Plus(v2 Vec3) Vec3 {
	return Vec3{v[0] + v2[0], v[1] + v2[1], v[2] + v2[2]}
}

// Minus returns the difference between this vector and v2.
func (v Vec3) Minus(v2 Vec3) Vec3 {
	return Vec3{v[0] - v2[0], v[1] - v2[1], v[2] - v2[2]}
}

// Times returns the product of this vector and v2.
func (v Vec3) Times(v2 Vec3) Vec3 {
	return Vec3{v[0] * v2[0], v[1] * v2[1], v[2] * v2[2]}
}

// Scaled returns a new vector scaled by n.
func (v Vec3) Scaled(n float64) Vec3 {
	return Vec3{v[0] * n, v[1] * n, v[2] * n}
}

func (v Vec3) Div(n float64) Vec3 {
	return v.Scaled(1.0 / n)
}

// Len returns the vector's length.
func (v Vec3) Len() float64 {
	return math.Sqrt(v.LenSq())
}

// Dot returns the dot product of this vector and v2.
func (v Vec3) Dot(v2 Vec3) float64 {
	return v[0]*v2[0] + v[1]*v2[1] + v[2]*v2[2]
}

// Cross returns the cross product of this vector and v2.
func (v Vec3) Cross(v2 Vec3) Vec3 {
	return Vec3{
		v[1]*v2[2] - v[2]*v2[1],
		v[2]*v2[0] - v[0]*v2[2],
		v[0]*v2[1] - v[1]*v2[0],
	}
}
