# Centsible | App Design Specification

**Centsible** is a family-oriented banking and chore management application designed to teach children financial literacy through hands-on earning, saving, and goal-setting.

---

## 1. Brand Identity & Visual Language

### Core Philosophy
The design balances **playful engagement** for children with **authoritative clarity** for parents. It uses soft rounded corners, vibrant but professional colors, and a "Chore Bot" mascot to make finance feel less like a chore and more like a journey.

### Brand Assets
* **Logo:** A friendly green piggy bank featuring a "C" with an embedded growth arrow, symbolizing financial upward mobility.
* **Typography:** Bold, rounded sans-serif for headers (engaging); clean, standard sans-serif for data and parent UI (legible).
* **Color Palette:** * **Growth Green:** Used for balances, rewards, and "Approve" actions.
    * **Action Orange:** Used for withdrawals and "Edit" functions.
    * **Secure Blue:** The primary background and sidebar color for the parent UI.

---

## 2. Kid UI Architecture (Android)

### Phone Layout (Portrait)
* **Dashboard:** A vertical stack focused on the "Total Stash." Large touch targets for Deposit/Withdraw.
* **Chore Bot:** A single-column scrolling list. Each chore is a high-contrast card with an icon and a dollar value.
* **Goal Setter:** Large, image-heavy cards (e.g., "New Bike") that make saving feel tangible.

### Tablet Layout (Landscape Optimization)
* **Sidebar Navigation:** Replaces the bottom nav for easier access on large screens.
* **Master-Detail Views:** In the Chore section, the left pane shows the task list while the right pane shows specific instructions and the "Complete" button.
* **Grid System:** Goals are displayed in a multi-column grid, allowing kids to compare progress across multiple savings targets simultaneously.

---

## 3. Parent UI Architecture (Tablet Focus)

The parent interface is optimized for high-resolution tablet displays, prioritizing management and oversight.

### Key Screens
1. **Parent Command Center:** * **Central Approval Hub:** A consolidated feed of pending transaction requests and chore completions from all children in the household.
    * **Quick Actions:** One-tap "Approve" (Green) or "Deny" (Red) buttons to minimize administrative friction.

2. **Family Overview:** * **Comparative Analytics:** Side-by-side vertical columns for each child (e.g., Alex and Maya).
    * **Trend Mapping:** High-fidelity line graphs showing savings growth over months or years.

3. **Chores Marketplace:** * **Template Management:** A library of available chores where parents can edit values or frequencies.
    * **Chore Creation:** A split-pane form where parents can select icons and assign tasks to specific children or the "General Pool."

---

## 4. Feature Set

| Feature | Kid Functionality | Parent Functionality |
| :--- | :--- | :--- |
| **Banking** | View balance (Spend/Save/Give), request withdrawals. | Approve transactions, set "interest" rates, view history. |
| **Chores** | View available tasks, submit work for approval. | Create/edit chores, set values, verify completion. |
| **Goals** | Set savings targets with photos, track progress. | View goal progress, provide "matching" contributions. |
| **Mascot** | Interaction with "Centsible Bot" for guidance. | N/A (Professional Management View). |

---

## 5. Technical Requirements
* **Platform:** Android (Optimized for Mobile & Tablet).
* **Responsive Engine:** Material Design 3 (M3) components.
* **Architecture:** Multi-user household accounts with real-time sync between parent and kid devices.