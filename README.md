# Catherine Reid — static website

This is a static redesign of the old Flask/Heroku site. It can be deployed directly to GitHub Pages: there is no Python web server and no database.

The public events section uses a **Google Calendar → iCal feed → GitHub Actions → `events.json`** workflow. It does **not** use the Google Calendar API, a Google Cloud project, or an API key.

## 1. Preview locally

From this folder, run a simple local server (opening `index.html` as a `file://` URL will block the JSON fetch in some browsers):

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Until the calendar sync has run, the site will simply display “No upcoming public events.”

## 2. Create Catherine's public Google Calendar

Use a dedicated calendar containing **only events intended to appear publicly on the website**.

1. In Google Calendar, create a calendar such as **Catherine Reid Public Events**.
2. Open that calendar's **Settings and sharing** page.
3. Under **Access permissions for events**, make the calendar available to the public.
4. Under **Integrate calendar**, find the **Public address in iCal format**.
5. Copy that `.ics` URL.

Catherine's ongoing workflow is then just normal Google Calendar use: add, edit, cancel, or repeat events there. She never needs to edit the website.

## 3. Give the iCal URL to GitHub

Do not paste the URL into the website source. Store it as a GitHub Actions secret instead:

1. Open the website repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions**.
3. Choose **New repository secret**.
4. Name it exactly:

   `CALENDAR_ICS_URL`

5. Paste the Google Calendar **Public address in iCal format** as the value.

The calendar itself is public, so this URL is not an authentication credential. Keeping it in a repository secret still avoids unnecessarily publishing the raw feed address in the source tree.

## 4. How the automatic update works

The repository includes:

- `.github/workflows/update-calendar.yml` — runs the sync once an hour and can also be run manually.
- `scripts/update_calendar.py` — downloads the `.ics` feed, expands recurring events, keeps upcoming events, and writes `events.json`.
- `events.json` — the only calendar file the browser reads.

The website therefore never contacts Google Calendar from a visitor's browser.

The scheduled workflow runs at minute 17 of every hour. GitHub scheduled workflows can occasionally start later than their nominal time, so calendar changes should be thought of as appearing **within roughly an hour**, not instantly.

### Run a sync immediately

After creating the `CALENDAR_ICS_URL` secret, open:

**Actions → Update public calendar → Run workflow**

That will generate the first real `events.json` without waiting for the hourly schedule.

### Changing the number of displayed events

The workflow currently sets:

```yaml
MAX_EVENTS: "8"
LOOKAHEAD_DAYS: "365"
```

Change those values in `.github/workflows/update-calendar.yml` if desired.

## 5. Deploy to GitHub Pages

1. Create a GitHub repository and copy these files into its root.
2. Commit and push.
3. In **Settings → Pages**, choose **Deploy from a branch**, then select your main branch and `/ (root)`.
4. GitHub will publish the site at the Pages URL.
5. Add the `CALENDAR_ICS_URL` repository secret described above.
6. Run **Update public calendar** once manually to populate the first event list.

After that, Catherine only maintains Google Calendar.

## 6. Calendar privacy and content notes

Only use a calendar whose contents are intended to be public. Event titles, dates, locations, descriptions, and event URLs can be copied into `events.json` and published on the website.

The sync includes recurring-event support. Cancelled events are omitted. It currently looks one year ahead and displays the first eight upcoming occurrences.

## 7. Image migration note

The source upload included the Flask/Python content and templates, but not the old `static/img` directory. To keep the redesign immediately viewable, existing artwork and in-description image references currently point back to the old Heroku site's image URLs.

For a fully self-contained GitHub site, copy the old image files into `assets/images/` and replace those remote URLs. The painting filenames to migrate are already recorded in `assets/content.json`.

## 8. Adding new creative work later

Current works were migrated into `assets/content.json`. New pieces can be added there later without changing the calendar workflow.

## Security cleanup from the old app

The old uploaded `config.py` contains SendGrid and reCAPTCHA secrets. They are intentionally excluded from this redesign. Rotate/revoke those credentials before publishing the old source anywhere.
