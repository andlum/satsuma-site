// Shared data for every file in src/projects/. Only live projects get a page,
// and not those with `projectPage: false`, which link straight out instead;
// everything else still appears in the roster via the `projects` collection.
module.exports = {
  layout: "project.html",
  tags: ["projects"],
  eleventyComputed: {
    permalink: (data) => (data.status === "live" && data.projectPage !== false ? `/projects/${data.slug}/` : false),
    description: (data) => data.oneLine,
  },
};
