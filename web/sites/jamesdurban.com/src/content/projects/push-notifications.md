---
title: Push Notifications
publishDate: 2025-10-04 00:00:00
img_alt: Push Notifications
skills:
  - Backend
  - Firebase
  - REST API
  - .NET / C#
  - Service Bus Messaging
github: private
type: professional
---

# Overview

During my time at PayPoint, I was tasked with building a push notification service for the BBC to allow them to send push notifications to their users when their TVL Licensing account had a low balance.

# How was it built?

The Push Notifications were built using C# with Firebase. It worked by storing push token information for each user from a mobile app we have. This allowed people to enable / disable push notifications for a specific device. It also meant that a single user could have multiple devices registered.

## Backend

I was responsible for building the backend services that would be used by the mobile app.

- **C#** and **.NET Web API** used as the primary language and framework.
- **Firebase** used for delivering push notifications to mobile devices.
- **Azure Cosmos DB** used for persisting push token information.
- **Azure Service Bus** used for cross-service communication.
- **Grafana**, **Loki** and **Prometheus** used for monitoring and observability.

## Frontend

The frontend was not built by me, instead we had a separate mobile app developer that built and maintained the app.
I worked with them to integrate the push notifications into the app.

- **React Native** The main framework that the mobile app was built with.
