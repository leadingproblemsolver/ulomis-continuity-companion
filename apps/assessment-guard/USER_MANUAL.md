# Assessment Guard — User Manual

**Version 1 · October 2026 · Independent student project by Taha (INFS1101)**

Assessment Guard helps a student make sure every assessment date they rely on was **checked against an official source** and **actually landed in their own calendar**.

> **Important.** This is not a university service. It is not connected to D2L, it does not sync anything, and it does not send reminders. Your instructor and D2L are always the source of truth.

---

## Contents

1. Opening the tool
2. The screen at a glance
3. Add an assessment (step by step)
4. Put it in your calendar (step by step)
5. Check your list each week
6. Change or delete an assessment
7. Grade scenarios
8. Back up and restore your data
9. Larger text and keyboard use
10. Demo mode (for a quick look)
11. Troubleshooting
12. Privacy and limits
13. For instructors: a 60-second walkthrough

---

## 1. Opening the tool

You can open it in either of two ways:

- **Online link** — https://claude.ai/artifact/LA1XQtuUnJGsVQPP4L7oNs — opens in any browser, on a phone or a computer.
- **Offline file** — open `Assessment-Guard.html` by double-clicking it. It works without internet. This version can also download `.ics` calendar files.

Your data is saved **in the browser you use**. If you switch between the online link and the offline file, or between devices, each one keeps its own separate list. Use a backup (section 8) to move your data.

---

## 2. The screen at a glance

From top to bottom:

| Part                                      | What it is for                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Dark header                               | The "unofficial tool" notice, **Text size**, and **Show synthetic demo** |
| How to use it                             | A short version of this manual. Press its heading to hide or show it     |
| **1. Add an assessment you have checked** | The form where you enter a date                                          |
| **2. Your assessments**                   | Your saved list, in date order, with status labels and buttons           |
| **3. Grade scenarios**                    | A what-if calculator using INFS1101 weights                              |
| **4. Your data**                          | Backup, restore, and delete everything                                   |
| How it decides                            | The rules the tool follows, in plain words                               |

Messages about what just happened (saved, not saved, copied, and so on) appear in a blue box near the top.

---

## 3. Add an assessment (step by step)

1. **Open the official source first.** Open the D2L announcement, the instructor's email, or the official course schedule. Keep it open.
2. **Course code** — leave `INFS1101`, or type another course code.
3. **Assessment type** — choose Midterm Exam, Final Exam, Quiz, Test, Lab, or Other.
4. **Name** — optional, such as `Quiz 3`. Required if you chose **Other**.
5. **Date and time** — enter the date and time **exactly as the announcement says**, in your local time.
6. **Check the grey line under the date.** It shows exactly what will be saved, for example:
   _Will be saved as: Thursday 22 October 2026 at 10:00 — Asia/Qatar (UTC+03:00)._
   If the day or time is wrong, fix it now.
7. **Have you checked this date against an official source?**
   - Choose **Yes — I checked it myself** if you are reading it from the official source right now.
   - Choose **Not yet** if you only heard about it. It will be saved and clearly marked **Unverified** until you check.
8. If you chose **Yes**, fill in:
   - **Where did you check it?** (D2L announcement, instructor email, and so on)
   - **What exactly did you check?** — the announcement title, email subject, or link. This is how you can find it again later.
9. **Room or details** — optional, such as a room number or section.
10. Press **Save assessment**.

**If something is missing or wrong,** a red box appears listing each problem. Click a problem to jump to that field. Nothing is saved until every problem is fixed.

**The tool will refuse:**

- a missing date or a date that does not exist (such as 30 February);
- "Yes — I checked it" without a source and a reference;
- the same assessment saved twice at the same time.

---

## 4. Put it in your calendar (step by step)

Saving in the tool does **not** add anything to your calendar. Each upcoming assessment in **2. Your assessments** has three calendar buttons. Use whichever matches your calendar.

### Option A — Google Calendar

1. Press **Add to Google Calendar**. A new tab opens with the event already filled in.
2. Check the title, date and time.
3. Add reminders: we suggest **1 week**, **2 days** and **1 day** before.
4. Press **Save** in Google Calendar.

### Option B — Outlook (university / Microsoft 365 account)

1. Press **Add to Outlook**. A new tab opens in Outlook on the web. Sign in with your university account if asked.
2. Check the details, add reminders, and press **Save**.

### Option C — Apple Calendar, Outlook desktop, or other apps (.ics file)

1. Press **Download .ics file**.
2. Open the downloaded file. Your calendar app will offer to add the event.
3. Check the date, time and reminders. The file _asks_ for alerts 7 days, 48 hours and 24 hours before, but some apps ignore them. Add them yourself if they are missing.

> **On the online link:** the page cannot download files. When you press **Download .ics file** there, it shows the calendar text instead. Either use Option A or B, or press **Copy calendar text**, paste it into a plain-text file, save it as `assessment.ics`, and open it. The offline file downloads `.ics` normally.

### Finally — confirm it

Go back to Assessment Guard and press **I checked it is in my calendar** on that assessment. The "Not yet confirmed in your calendar app" warning disappears.

---

## 5. Check your list each week

Open the tool once a week, and again the day before anything important. Each assessment shows labels in words and symbols, not colour alone:

| Label                    | Meaning                          | What to do                            |
| ------------------------ | -------------------------------- | ------------------------------------- |
| ✖ Date has passed        | The time is in the past          | Check its status with your instructor |
| ⚠ Within 24 hours        | Starts within a day              | Prepare; re-check the official source |
| ⚠ Within 48 hours        | Starts within two days           | Re-check the official source          |
| ● Within 7 days          | Starts this week                 | Plan your study time                  |
| ○ Later                  | More than a week away            | Nothing urgent                        |
| ✔ Marked verified by you | You named the source you checked | —                                     |
| ? Unverified             | You have not checked it yet      | Check it, then use **Edit**           |

Extra warnings may appear under an assessment:

- **Not verified against an official source**
- **Not yet confirmed in your calendar app**
- **Changed after export — update the event in your calendar yourself**

Use the **Show** menu to see only **Needs attention**, **Upcoming only**, or **Past only**.

Press **Re-checked official source now** after you look at the announcement again. This updates the "Last checked" time. It does not change the date.

---

## 6. Change or delete an assessment

**To change a date or detail:**

1. Press **Edit** on the assessment. The form at the top fills in.
2. Change what you need and press **Save changes** (or **Cancel edit**).
3. If you had already added it to your calendar, the tool warns you: **your calendar still has the old event.** Add the new one and delete the old one in your calendar yourself.

**To delete one assessment:** press **Delete**, read the box that appears, then press **Delete it** (or **Cancel**, or the Esc key). Deleting here does **not** delete anything from your calendar.

---

## 7. Grade scenarios

This uses the weights in the INFS1101 Fall 2026 course master syllabus: **final 35%, midterm 20%, labs 10%, quizzes 15%, tests 20%. Passing grade 60%.**

1. Type the scores you actually know (0–100). **Leave unknown scores empty.** Empty never counts as zero.
2. **Target overall** is 60 by default. Change it if you want.
3. Optionally, type an average in **Projection** to see the total if you scored that on everything still to come.
4. Press **Calculate**.

The result tells you how much you still need on the remaining assessments, or whether the target is already secured or no longer possible.

**Try scenario: midterm counted as 0** is a what-if only. It is labelled "(scenario)" in the result and does **not** mean a zero is recorded anywhere.

> This is an estimate. Your section may use different rules, and the tool has no access to your real grades.

---

## 8. Back up and restore your data

Your list lives only in your browser. Clearing browser data, private browsing, or a new device will lose it.

- **Download backup (.json)** saves a file with all your assessments. On the online link you will be asked to confirm the download.
- **Restore from backup…** loads that file. It **adds** entries you don't already have and never overwrites existing ones. Broken files are refused, and your list stays as it was.
- **Delete all saved assessments** clears the list in this browser after you confirm. Your calendar is not touched.

---

## 9. Larger text and keyboard use

- **Text size** (top of the page): Standard, Large (150%), or Extra large (200%). Your choice is remembered in this browser. Browser zoom (Ctrl/Cmd and +) also works.
- Everything works with the keyboard: **Tab** moves forward, **Shift+Tab** moves back, **Enter** or **Space** presses a button, **Esc** closes the delete box. The first Tab shows **Skip to main content**.
- The focused item has a thick yellow outline.
- Status is always written in words, never shown by colour alone.
- Messages are announced to screen readers.

---

## 10. Demo mode (for a quick look)

Press **Show synthetic demo** at the top. A purple banner shows four example assessments for the course `DEMO101`, all labelled **[SYNTHETIC]**, in different states (passed, within 24 hours, unverified, later).

Nothing you do in demo mode is saved, and your own list is not affected. Press **Leave demo** to go back.

---

## 11. Troubleshooting

| Problem                                                | Fix                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| "Not saved. Fix the highlighted fields"                | Read the red box at the top of the form and fix each item                                       |
| "You already saved this assessment at this exact time" | It's already in your list. Use **Edit** if something changed                                    |
| "That date/time does not exist in your timezone"       | Check the day of the month, or pick a time that isn't skipped by a clock change                 |
| The Google or Outlook tab didn't open                  | Your browser may have blocked the new tab. Allow pop-ups for this page, or use the .ics option  |
| The calendar event shows the wrong time                | Check your calendar's timezone setting, then check the grey "Will be saved as" line in the tool |
| My list is empty                                       | You may be on a different browser, device, or version (online vs offline). Restore a backup     |
| "Saved data in this browser could not be read"         | The stored data was damaged. Nothing was deleted. Restore from a backup                         |
| "This browser refused to save"                         | Private browsing or full storage. Download a backup right away                                  |

---

## 12. Privacy and limits

- **Privacy:** nothing you enter is sent anywhere. There is no account, no server, and no tracking. Don't enter health, family or other personal details. The tool never asks for them.
- **No D2L connection:** "Verified" means _you_ say you checked. The tool cannot check D2L.
- **No reminders:** the tool does not send notifications. Reminders come from your own calendar.
- **No calendar sync:** changing or deleting something here never changes your calendar.
- **Not an academic remedy:** the tool does not excuse missed assessments, grant extensions, or replace university systems.

---

## 13. For instructors: a 60-second walkthrough

1. **(0–10 s)** Read the dark header: an unofficial tool with no D2L connection, no syncing and no reminders. The list starts empty; no dates are invented.
2. **(10–25 s)** Press **Save assessment** on the empty form to see the error summary. Enter a date, note the timezone line, choose "Yes — I checked it myself", pick a source, type a reference, and save.
3. **(25–40 s)** Press **Show synthetic demo** to see each status label and warning. Press **Leave demo**.
4. **(40–50 s)** On your entry, press **Add to Google Calendar** or **Add to Outlook** and note the event comes pre-filled. Back in the tool, press **I checked it is in my calendar**.
5. **(50–60 s)** In **Grade scenarios**, press **Try scenario: midterm counted as 0**, type 75 in Projection, and press **Calculate**: 75% on the remaining 80% gives exactly 60%.

How the tool maps to the INFS1101 learning outcomes (CLO1–CLO4), with pseudocode, a flowchart and the tests, is in `docs/INFS1101_CLO_MAPPING.md` in the source repository:
https://github.com/leadingproblemsolver/ulomis-continuity-companion/tree/main/apps/assessment-guard
