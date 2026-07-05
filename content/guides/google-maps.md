---
title: "Does Google Maps Work in China? Access vs. Accuracy (2026)"
description: "Google Maps in China has two separate problems: access and map accuracy. Learn what an international eSIM fixes, what GCJ-02 offset does not, and what to use instead."
h1: "Google Maps in China: The Two Separate Problems"
cluster: "connect"
lastVerified: "2026-07-04"
sources:
  - label: "Wikipedia: Restrictions on geographic data in China"
    url: "https://en.wikipedia.org/"
  - label: "Google Maps Help community discussion on China map offset"
    url: "https://support.google.com/"
  - label: "Trip.com guide to map apps in China"
    url: "https://www.trip.com/"
faq:
  - q: "Will a VPN fix Google Maps in China?"
    a: "No. A VPN can address access, but it does not fix the GCJ-02 coordinate offset. The access problem and the accuracy problem are separate."
  - q: "Why is the blue dot wrong in China?"
    a: "China uses the GCJ-02 coordinate system while Google Maps uses WGS-84. That coordinate mismatch can put your blue dot, walking route, or entrance pin in the wrong place."
  # TODO(verify): Confirm exact Hong Kong/Macau GCJ-02 exemption wording before publishing a concrete rule.
  - q: "Does Google Maps work in Hong Kong?"
    a: "This guide is for mainland China. For Hong Kong or Macau, do a separate local maps check before relying on the mainland-China offset rule."
  - q: "Is the offset illegal to fix?"
    a: "Do not rely on third-party correction tools. The map problem comes from the legal GCJ-02 coordinate requirement, and unofficial correction routes are a gray-area workaround."
  - q: "What is the best offline backup?"
    a: "Keep an offline backup such as maps.me or Organic Maps. Their data can be old, but they are useful as a fallback when you need a non-Google map layer."
steps: []
troubleshooting: []
---

## Short answer

Google Maps in mainland China has two separate problems: access and accuracy.

An international eSIM or roaming plan with overseas routing can restore access so the app opens. That does not make Google Maps accurate for close-range navigation. The GCJ-02 coordinate offset still exists, so the blue dot can drift and walking directions can point you to the wrong entrance.

Use [Apple Maps or Amap](/connect/maps-apps/) for day-to-day navigation in China. Keep Google Maps for pre-trip planning, rough orientation, and place-name searching. For the broader phone setup, start at the [connectivity hub](/connect/) and keep the [eSIM guide](/connect/esim/) in your plan.

## Problem 1: access

The first problem is access. Google Maps is blocked in mainland China, so a normal local data connection may not open it.

An international eSIM or roaming setup can route traffic through an overseas exit. That solves the access layer: the app can load and search can work.

Access is not accuracy. Treat those as two separate checks before you navigate.

## Problem 2: the 50-500m offset

The second problem is the map itself. China requires the GCJ-02 coordinate system, while Google Maps uses WGS-84. The result is a real offset, often roughly 50-500m.

That offset does not disappear because you used an eSIM, roaming, or a VPN. It can show up as:

- A blue dot that looks shifted from the street you are standing on.
- Walking navigation that points to the wrong entrance.
- Satellite or hybrid map layers that do not line up cleanly with roads and pins.

This is why "Google Maps opens" and "Google Maps is reliable for walking directions" are not the same answer.

## What to use instead

| Traveler setup | Use this map app | Why |
| --- | --- | --- |
| iPhone | Apple Maps | Apple Maps uses AutoNavi/Amap licensed data in China, has GCJ-02 built in, and is the practical iPhone default. |
| Android | Amap English version | Amap is the local map app with the strongest POI, transit, and ride-hailing integration for China. |
| Offline fallback | maps.me or Organic Maps | Use them as backup map layers. Their data can be old, but they are useful when you need an offline fallback. |

For train-station days, use the [China trains guide](/trains/) alongside your map app because station entrances and walking routes are exactly where the offset can hurt.

## If you still use Google Maps

Google Maps can still be useful before and during a China trip, but keep it in the right role.

Use it for:

- Pre-trip planning.
- Rough orientation.
- Place-name searching.

Do not rely on it for:

- Walking navigation.
- Precise blue-dot positioning.
- Finding the exact entrance to a station, shop, or hotel.

For live navigation, compare [Apple Maps vs Amap](/connect/maps-apps/) and choose the one that fits your phone.
