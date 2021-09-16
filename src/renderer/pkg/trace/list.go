package trace

import "tracer/pkg/geom"

// List holds a list of Surfaces
type List struct {
	HH []Hitter
}

// NewList creates a new list of Hitters
func NewList(h ...Hitter) List {
	return List{HH: h}
}

// Hit finds the first intersection (if any) between Ray r and any of the Hitters in the List.
// If no intersection is found, t = 0.
func (l List) Hit(r geom.Ray, tMin, tMax float64) (t float64, b Bouncer) {
	closest := tMax
	for _, h := range l.HH {
		if ht, hb := h.Hit(r, tMin, closest); ht > 0 {
			closest, t = ht, ht
			b = hb
		}
	}
	return
}

func (l List) Plus(h ...Hitter) List {
	return NewList(append(l.HH, h...)...)
}
