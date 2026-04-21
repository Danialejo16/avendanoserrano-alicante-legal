import DOMPurify from "dompurify";

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);

// Allow iframes for video embeds (YouTube/Vimeo) plus standard rich-text tags
export const sanitizeBlogHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "src",
      "title",
      "loading",
      "referrerpolicy",
      "target",
      "rel",
    ],
  });

export const youtubeIdFromUrl = (url: string): string | null => {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
};

export const vimeoIdFromUrl = (url: string): string | null => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

export const videoUrlToEmbedHtml = (url: string): string | null => {
  const yt = youtubeIdFromUrl(url);
  if (yt) {
    return `<p><iframe src="https://www.youtube.com/embed/${yt}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:8px;"></iframe></p>`;
  }
  const vm = vimeoIdFromUrl(url);
  if (vm) {
    return `<p><iframe src="https://player.vimeo.com/video/${vm}" title="Vimeo video" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:8px;"></iframe></p>`;
  }
  return null;
};
