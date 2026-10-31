const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Short content hashes of the stylesheet and each script in src/js, used as
// cache-busting query strings in the layout. GitHub Pages serves static files
// with a four-hour max-age, so without this a deploy can leave the CDN handing
// out the previous stylesheet or script against the new HTML. A hash only
// changes when its file actually changes.
const hash = (file) =>
  crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);

module.exports = () => {
  const jsHash = {};
  for (const file of fs.readdirSync("src/js")) {
    if (file.endsWith(".js")) jsHash[path.basename(file, ".js")] = hash(path.join("src/js", file));
  }
  return { cssHash: hash("src/css/styles.css"), jsHash };
};
