# LostLink

## Campus Lost and Found Management System

LostLink is a web-based Lost and Found Management System designed for educational institutions. The system provides a centralized platform where students can report lost and found items, search for matching items, and submit claims for items they believe belong to them.

The main purpose of LostLink is to make the process of reporting and recovering lost belongings easier, faster, and more organized within a college campus.

---

## Features

### User Management
- User registration
- User login
- User profile management
- Secure session handling
- Logout functionality

### Lost Item Management
- Report lost items
- Add item name and description
- Add location where the item was lost
- Add date and time information
- Upload item images
- View reported lost items
- Update item information

### Found Item Management
- Report found items
- Add item details
- Add found location
- Add date information
- Upload images
- View found items

### Search and Filter
- Search for lost and found items
- Filter items based on category
- Filter items based on location
- View item details
- Find possible matches between lost and found items

### Claim Management
- Submit a claim for an item
- Provide information to verify ownership
- Track claim status
- Manage submitted claims

### Admin Management
- View reported items
- Manage users
- Manage lost and found reports
- Review claims
- Monitor system activity
- Remove inappropriate or invalid reports

---

## Objectives

The main objectives of LostLink are:

1. To provide a centralized platform for managing lost and found items.
2. To reduce the time required to recover lost belongings.
3. To make reporting lost and found items simple and convenient.
4. To provide an organized search and filtering system.
5. To provide a structured process for claiming lost items.
6. To help administrators manage campus lost and found activities efficiently.

---

## Problem Statement

Students frequently lose personal belongings such as ID cards, books, wallets, electronic devices, keys, and other valuable items on campus.

Traditional methods of finding lost items often depend on notice boards, messaging groups, announcements, or manually contacting different people. These methods can be slow and make it difficult to track reports.

LostLink addresses this problem by providing a centralized digital platform for reporting, searching, and managing lost and found items.

---

## Proposed Solution

LostLink provides a single platform where students can:

- Report lost belongings.
- Report items they have found.
- Search existing reports.
- Filter reports according to different criteria.
- View complete item information.
- Submit claims for found items.
- Track the status of their reports.

Administrators can monitor reports and manage the overall system.

---

## System Modules

### 1. User Module

The User Module manages student accounts and provides access to the main features of the application.

Functions include:

- Registration
- Login
- Logout
- Profile management
- Viewing personal reports
- Tracking claims

---

### 2. Lost Item Module

This module allows students to report items that they have lost.

Users can provide information such as:

- Item name
- Category
- Description
- Lost location
- Date
- Additional details
- Image

The reported item is then displayed in the lost item section.

---

### 3. Found Item Module

This module allows students to report items that they have found.

Users can enter:

- Item name
- Category
- Description
- Found location
- Date
- Additional information
- Image

Other users can search these reports to identify their belongings.

---

### 4. Search and Filter Module

The Search and Filter Module helps users quickly find relevant reports.

Users can search using:

- Item name
- Category
- Location
- Keywords

Filters help reduce the number of results and make it easier to identify a possible match.

---

### 5. Claim Module

When a user identifies a found item as their lost belonging, they can submit a claim.

The claim process can include:

1. Selecting the item.
2. Providing ownership information.
3. Submitting the claim.
4. Waiting for verification.
5. Checking the claim status.

This provides a more organized method of returning belongings to their owners.

---

### 6. Admin Module

The Admin Module provides management facilities for administrators.

Administrators can:

- View users.
- View lost item reports.
- View found item reports.
- Review claims.
- Manage inappropriate reports.
- Monitor system activity.

---

## Technology Stack

### Frontend

- React.js
- TypeScript
- HTML5
- CSS3
- Tailwind CSS
- Vite

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Bun

---

## System Architecture

The application follows a component-based web application architecture.

```text
              ┌──────────────────────┐
              │       User           │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   LostLink Web App   │
              │    React Frontend    │
              └──────────┬───────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     User Module    Lost/Found      Search &
                    Management       Filter
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Claim Management  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Admin Management   │
              └──────────────────────┘
User
  │
  ▼
Register / Login
  │
  ▼
Dashboard
  │
  ├───────────────┐
  │               │
  ▼               ▼
Report Lost    Report Found
  │               │
  └───────┬───────┘
          ▼
    Search Items
          │
          ▼
    View Item Details
          │
          ▼
      Submit Claim
          │
          ▼
    Claim Verification
          │
          ▼
     Item Recovered

Administrator
      │
      ▼
   Dashboard
      │
      ├───────────────┐
      │               │
      ▼               ▼
 Manage Users    Manage Reports
                      │
                      ▼
                Review Claims
                      │
                      ▼
               Update Status
