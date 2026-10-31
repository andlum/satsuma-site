// Shared data for every file in src/projects/. Only live projects get a page;
// everything else still appears in the roster via the `projects` collection.
module.exports = {
  layout: "project.html",
  tags: ["projects"],
  eleventyComputed: {
    permalink: (data) => (data.status === "live" ? `/projects/${data.slug}/` : false),
    description: (data) => data.oneLine,
  },
};
