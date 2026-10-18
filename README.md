# satsuma.works

Landing page for Satsuma, hosted on GitHub Pages. Plain HTML and CSS, no
build step. Edit `index.html` and `style.css`, commit, push; Pages redeploys
in about a minute.

## One-time setup (owner runs these)

### 1. Create the GitHub repo and push

```bash
cd ~/Dev/satsuma-site
gh repo create satsuma-site --public --source=. --remote=origin --push
```

### 2. Enable GitHub Pages

Either in the browser: repo **Settings > Pages** > Build and deployment >
Source **Deploy from a branch**, branch **main**, folder **/ (root)**, Save.

Or from the terminal:

```bash
gh api -X POST repos/andlum/satsuma-site/pages -f 'source[branch]=main' -f 'source[path]=/'
```

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
2. Copy the `token` value from the snippet Cloudflare shows and replace
   `YOUR-TOKEN` in `index.html`. The rest of the snippet is already
   there. Commit and push.
3. Data appears in the same Web Analytics page within a few minutes of
   the first visit.

When the domain moves to Cloudflare in December you can leave this as is,
or switch the site to automatic setup and drop the script tag.

## Later: moving the domain to Cloudflare

Planned after 2026-12-17 (60-day transfer lock after registration). When
that happens, recreate the same A/CNAME/MX/TXT records at Cloudflare before
switching nameservers. Set the A records and `www` CNAME to **DNS only**
(grey cloud), not proxied, so GitHub can keep issuing the certificate.
