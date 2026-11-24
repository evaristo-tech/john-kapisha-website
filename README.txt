JOHN KAPISHA — PERSONAL WEBSITE
================================
Open index.html in a browser (works offline). Search every file for "EDIT THIS" to find text you can change.

Files
  *.html           the pages
  css/style.css    colours, fonts, glass/animation effects (colours are the variables at the top)
  css/tailwind.css layout utilities (generated — do not edit by hand)
  js/script.js     theme toggle, menu, animations, Ctrl+K menu, project popup, form
  fonts/           Inter + Manrope (so the site looks right offline)
  assets/          resume.pdf, research-essay.pdf and images
                     images/profile.jpg   = his photo (Home + About)
                     images/projects/     = certificates / photos shown on the Projects page
                     images/gallery/      = put gallery photos here (see the instructions inside gallery.html)

ONLY if you add a NEW Tailwind class (e.g. a class that isn't already used somewhere on the site):
  1. Install Node.js (nodejs.org)
  2. In this folder run:
       npx tailwindcss@3.4.17 -i ./src/input.css -o ./css/tailwind.css --minify
Changing text, links, images and colours never needs this step.

Replacing a document: overwrite assets/resume.pdf or assets/research-essay.pdf with the new PDF, keeping the same file name.
Adding a picture to a project that has none yet: save it in assets/images/projects/, then copy the cover/data-img lines from a project that already has a picture (projects.html).
