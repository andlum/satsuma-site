# satsuma.works

The public site of Studio Satsuma, hosted on GitHub Pages. It is an
[Eleventy 3](https://www.11ty.dev/) site that mirrors `andlum.github.io`:
`src/` in, `public/` out, deployed by the GitHub Actions workflow in
`.github/workflows/build.yml` on every push to `main`.

The full design and copy spec is `docs/spec-2026-11-rebrand.md`.

## Working on the site

```bash
npm install
npm run dev      # http://localhost:8889, rebuilds on save
npm run build    # writes the site to public/
```

Layout:

- `src/index.njk` is the homepage. `src/_includes/layout.html` wraps every
  page (fonts, favicon, theme color, Cloudflare beacon, footer).
- `src/projects/*.md` is the roster: one file per project, front matter as in
  the spec (`title`, `slug`, `status`, `oneLine`, `platform`, `links`, `slot`,
  `icon`, `draft`). Live projects get a page at `/projects/<slug>/` from
  `src/_includes/project.html`; every non-draft project appears in the
  homepage list. `draft: true` keeps a file out of the build entirely. Two
  projects on the same `slot` fail the build.
- `src/css/styles.css` is the one stylesheet, served with a content hash from
  `src/_data/assets.js`. `src/img` and `src/js` are copied through as-is.

Placeholders in square brackets (`[one line]`, `[WHO IT'S FOR: ...]`) are
roster facts still to be filled in.

## One-time setup (owner runs these)

### 1. Create the GitHub repo and push

```bash
cd ~/Dev/satsuma-site
gh repo create satsuma-site --public --source=. --remote=origin --push
```

### 2. Enable GitHub Pages, deploying from GitHub Actions

The site is built by Actions, so Pages must take its content from the
workflow rather than from a branch. In the browser: repo **Settings > Pages**
> Build and deployment > Source **GitHub Actions**. No workflow template is
needed; `.github/workflows/build.yml` is already in the repo.

Or from the terminal (use `PUT` instead of `POST` if Pages is already on):

```bash
gh api -X POST repos/andlum/satsuma-site/pages -f 'build_type=workflow'
```

If Pages was previously set to **Deploy from a branch** (the pre-Eleventy
setup), switch it to **GitHub Actions** the same way; the first push to
`main` afterwards runs the workflow and publishes `public/`.

### 3. Custom domain

Still under **Settings > Pages**, set Custom domain to `satsuma.works` and
Save. GitHub will write a `CNAME` file to the repo if one is not there
already (this repo commits it, so nothing changes). The DNS check will fail
until step 4 propagates.

### 4. DNS at Porkbun

Porkbun > Domain Management > satsuma.works > DNS Records.

**Remove** any parked-page record Porkbun added at registration. It is
usually an `ALIAS` or `A` record on the apex (host left blank or `@`)
pointing at `pixie.porkbun.com` or a Porkbun IP, and sometimes a `CNAME`
on `www` pointing at the same place. Leave everything else alone.

**Add** these records:

| Type  | Host  | Answer                | TTL |
|-------|-------|-----------------------|-----|
| A     | (blank / `@`) | `185.199.108.153` | 600 |
| A     | (blank / `@`) | `185.199.109.153` | 600 |
| A     | (blank / `@`) | `185.199.110.153` | 600 |
| A     | (blank / `@`) | `185.199.111.153` | 600 |
| CNAME | `www` | `andlum.github.io`    | 600 |

**Keep untouched:** the `MX` records and the `TXT` SPF record
(`v=spf1 include:_spf.porkbun.com include:_spf.google.com ~all`) that make
hello@satsuma.works forwarding work. Adding A records on the apex does not
affect mail; only MX/TXT do.

Check propagation:

```bash
dig +short satsuma.works A
dig +short www.satsuma.works CNAME
```

You want the four `185.199.*` addresses and `andlum.github.io.`.

### 5. Enforce HTTPS

Back in **Settings > Pages**, once the custom-domain check turns green,
GitHub requests a Let's Encrypt certificate. This can take from a few
minutes to about an hour after DNS resolves. When the **Enforce HTTPS** box
becomes clickable, tick it.

### 6. Verify

- https://satsuma.works loads with a padlock.
- https://www.satsuma.works redirects to the apex.
- Send a test mail to hello@satsuma.works and confirm it still forwards.

## Analytics: Cloudflare Web Analytics

The page loads the Cloudflare Web Analytics beacon (no cookies, no
personal data, no cross-site tracking). It works on GitHub Pages without
moving DNS to Cloudflare. To finish:

1. In the Cloudflare dashboard go to **Analytics & Logs > Web Analytics**
   (sometimes just **Web Analytics** in the left sidebar), click
   **Add a site**, enter `satsuma.works`, and choose the manual
   JavaScript snippet option (not automatic setup, since the domain is
   not proxied by Cloudflare yet).
2. The token is already in `src/_includes/layout.html`. If you ever re-create the site
   in Cloudflare, copy the new token into the `data-cf-beacon` attribute.
3. Data appears in the same Web Analytics page within a few minutes of
   the first visit.

When the domain moves to Cloudflare in December you can leave this as is,
or switch the site to automatic setup and drop the script tag.

## Later: moving the domain to Cloudflare

Planned after 2026-12-17 (60-day transfer lock after registration). When
that happens, recreate the same A/CNAME/MX/TXT records at Cloudflare before
switching nameservers. Set the A records and `www` CNAME to **DNS only**
(grey cloud), not proxied, so GitHub can keep issuing the certificate.
