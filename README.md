# EcoHydroLab website

Static website for EcoHydroLab, Department of Hydrology, IIT Roorkee.
Plain HTML/CSS/JS — no build step, no dependencies. Content lives in editable
JSON files so you can update it without touching HTML.

## Deploy to GitHub Pages (one time, ~5 minutes)

1. Create a GitHub account (if you don't have one) and a new **public** repository.
   - For a site at `https://<username>.github.io/`, name the repo exactly
     `<username>.github.io`.
   - For a project URL like `https://<username>.github.io/ecohydrolab/`,
     name it anything (e.g. `ecohydrolab`).

2. Upload these files. Easiest via the web UI:
   **Add file → Upload files**, drag in everything in this folder
   (including the `assets`, `data` folders and the hidden `.nojekyll` file),
   then **Commit changes**.

   Or via command line:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment**.
   Set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
   Save. Your site goes live in a minute or two at the URL shown there.

4. (Optional) Custom domain: in **Settings → Pages**, add your domain and
   create the matching DNS record with your registrar.

## Editing content

You rarely need to touch HTML. Edit these files:

| To change | Edit |
|-----------|------|
| Publications | `data/publications.json` |
| Team members | `data/team.json` |
| News / updates | `data/news.json` |
| Research text, hero, CTAs | the relevant `.html` file |

### publications.json
Each entry:
```json
{
  "title": "Paper title",
  "authors": "Last, F., & Other, A.",
  "venue": "Journal name",
  "year": 2025,
  "type": "Article",           // or "Dataset", "Preprint"
  "featured": true,             // optional, shows a Featured badge
  "doi": "10.xxxx/xxxxx",       // optional, links the title
  "tags": ["Deep Learning"],    // drive the filter buttons
  "links": [ { "label": "PDF", "url": "https://..." } ]
}
```
Papers are grouped by `year` automatically (newest first). The filter buttons
are generated from the `tags` you use.

### team.json
Groups (PI, Research Scholars, Alumni…) each contain `members`. Add a photo by
putting an image in `assets/img/` and setting `"photo": "assets/img/name.jpg"`.
If `photo` is empty, initials are shown automatically.

### news.json
Newest first. `text` accepts HTML (links, `<strong>`, `<em>`). The homepage
shows the latest 4; the News page shows all.

## To do before going public
- Replace placeholder author strings in `publications.json` with full author lists.
- Fill in real team members in `team.json` and add photos.
- Update GitHub/Scholar/ORCID links (search for `https://github.com/` and
  `https://scholar.google.com/` placeholders across the HTML and JSON).
- Point the code cards in `datasets.html` at your real repositories.
- Add your real news items.

## Local preview
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 . (A plain file-open won't work because the
pages load JSON via fetch, which needs a server.)
