---
title: "eSIM or Local SIM Card for China? A 60-Second Decision"
description: "Use this static decision tree to choose an international eSIM or a local physical SIM for China, based on phone support, trip length, and local-number needs."
h1: "eSIM vs Local SIM for China"
cluster: "connect"
lastVerified: "2026-07-04"
sources:
  - label: "Nomad eSIM official blog on China eSIM setup"
    url: "https://www.nomadesim.com/blogs/news/"
  - label: "Trip.com eSIM guide for China travel"
    url: "https://www.trip.com/guide/info/"
  - label: "MyChina Guide note on China domestic eSIM policy"
    url: "https://mychina.guide/china-esim/"
  - label: "Jetpac China eSIM guide"
    url: "https://www.jetpacglobal.com/blog/"
  - label: "Lotsotravel China eSIM guide"
    url: "https://lotsotravel.com/china-esim/"
faq:
  - q: "Can I have both at once?"
    a: "Yes. The useful split is international eSIM for data plus a physical SIM when you need a local number."
  - q: "Where at the airport?"
    a: "Look for physical SIM options after landing. Airports sell physical SIMs, not tourist eSIMs."
  - q: "What does passport registration involve?"
    a: "A local physical SIM requires passport registration. Do not expect a no-ID tourist SIM route."
  # TODO(verify): Confirm whether a tourist can top up a local physical SIM without a Chinese ID before publishing a hard rule.
  - q: "Can I top up a local SIM without a Chinese ID?"
    a: "Do not build your plan around local SIM top-ups until you verify the current process. If you need low-friction data, choose enough eSIM data before you fly."
decisionTree:
  title: "60-second decision"
  items:
    - question: "Does your phone support eSIM?"
      answer: "If yes, decide based on trip length and whether you need a local phone number."
      children:
        - question: "Staying under 30 days?"
          answer: "Choose an international eSIM. Install it before you fly, use it for data, and avoid ID registration."
        - question: "Staying over 30 days or need a local number?"
          answer: "Use a physical SIM after landing. Choose this when the local number matters more than the low-friction setup."
    - question: "No eSIM support?"
      answer: "Use an airport or carrier-shop physical SIM after arrival."
steps: []
troubleshooting: []
---

## Compare the tradeoff

The quick choice is simple: use an international eSIM for a short data-first trip, and use a local physical SIM when you need a China number or your phone does not support eSIM.

| Decision point | International eSIM | Local physical SIM |
| --- | --- | --- |
| When you get it | Install before you fly. | Buy after landing. |
| ID registration | No document registration. | Passport registration is required. |
| Internet routing | Overseas routing. | China network routing. |
| Firewall effect | Google, WhatsApp, and Maps can work directly. | The normal China firewall applies. |
| Local number | No local number. | Has a local number. |
| Typical cost position | Compare live prices before buying. | Usually more expensive. |

Start with [the China eSIM guide](/connect/esim/) if your phone supports eSIM. Start with the [connectivity hub](/connect/) if you still need the whole app setup.

## Why the firewall changes the math

A local physical SIM uses the China network route, so the normal firewall applies. That can matter immediately if your first-day plan depends on Google, WhatsApp, or Maps.

An international eSIM routes through an overseas gateway. That is why it can be the easier budget-DIY choice for data, even when a local physical SIM gives you a local number.

The local number is still useful in specific cases: registering China apps and receiving merchant calls. If an app setup needs SMS, keep [Alipay for foreigners](/money/alipay/) in your payment plan and decide whether a local number is worth the extra setup friction.

## When a local SIM still wins

Choose a local physical SIM when:

- Your phone does not support eSIM.
- You need a China phone number.
- You are staying longer than 30 days.

Choose an international eSIM when:

- Your phone supports eSIM.
- Your trip is under 30 days.
- You want data ready on arrival.
- You want Google, WhatsApp, and Maps to work directly without a separate VPN.

For map accuracy, do not stop at connectivity. Read [Google Maps in China](/connect/google-maps/) before relying on it for walking directions.
