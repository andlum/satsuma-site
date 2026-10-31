const STATUS_WORDS = {
  live: "Live",
  "in-progress": "In progress",
  "coming-soon": "Coming soon",
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  // Anything with `draft: true` in its front matter is left out of the build
  // and out of every collection. Kata's page is scaffolded this way until its
  // name is settled.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft) return false;
  });

  // Plain-English status word for the list and the project pages. The fruit
  // on the tree carries the metaphor; the words stay literal.
  eleventyConfig.addFilter("statusWord", (status) => {
    const word = STATUS_WORDS[status];
    if (!word) throw new Error(`Unknown project status "${status}"`);
    return word;
  });

  // Accessible label for the tree's SVG, generated from the roster:
  // "A satsuma tree with three fruit: two ripe, one still green."
  eleventyConfig.addFilter("treeLabel", (projects) => {
    const N = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
    const count = { live: 0, "in-progress": 0, "coming-soon": 0 };
    for (const project of projects) count[project.data.status]++;
    const parts = [];
    if (count.live) parts.push(`${N[count.live]} ripe`);
    if (count["in-progress"]) parts.push(`${N[count["in-progress"]]} still green`);
    if (count["coming-soon"]) parts.push(`${N[count["coming-soon"]]} in blossom`);
    const total = projects.length;
    return `A satsuma tree with ${N[total] || total} fruit: ${parts.join(", ")}.`;
  });

  // The roster, sorted by tree slot. Each project owns one of twelve fruit
  // positions so the tree never reshuffles; two projects on one slot is a
  // build error rather than a visual surprise.
  eleventyConfig.addCollection("projects", (api) => {
    const projects = api.getFilteredByTag("projects");
    const bySlot = new Map();
    for (const project of projects) {
      const { slot, slug, title, status } = project.data;
      if (!Number.isInteger(slot) || slot < 1 || slot > 12) {
        throw new Error(
          `Project "${title}" (${project.inputPath}) needs an integer slot between 1 and 12, got ${JSON.stringify(slot)}`
        );
      }
      if (!slug) {
        throw new Error(`Project "${title}" (${project.inputPath}) needs a slug`);
      }
      if (!STATUS_WORDS[status]) {
        throw new Error(
          `Project "${title}" (${project.inputPath}) has unknown status ${JSON.stringify(status)}; use live, in-progress or coming-soon`
        );
      }
      const taken = bySlot.get(slot);
      if (taken) {
        throw new Error(
          `Projects "${taken.data.title}" and "${title}" both claim tree slot ${slot}. Give one of them a different slot.`
        );
      }
      bySlot.set(slot, project);
    }
    return projects.sort((a, b) => a.data.slot - b.data.slot);
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
    templateFormats: ["md", "njk", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
