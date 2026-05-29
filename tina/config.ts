import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID ?? import.meta.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN ?? import.meta.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      // ── Person ────────────────────────────────────────────────────────
      {
        name: "person",
        label: "Personas",
        path: "src/content/people",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "name",
            label: "Nombre completo",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "Slug (URL)",
            required: true,
          },
          {
            type: "string",
            name: "branch",
            label: "Familia",
            required: true,
            options: [
              { value: "breton",   label: "Bretón" },
              { value: "guerrero", label: "Guerrero" },
              { value: "both",     label: "Ambas familias" },
            ],
          },
          {
            type: "number",
            name: "generation",
            label: "Generación",
            required: true,
            ui: {
              component: "select",
              options: [
                { value: 1, label: "Bisabuelos" },
                { value: 2, label: "Abuelos" },
                { value: 3, label: "Padres" },
                { value: 4, label: "Hijos" },
                { value: 5, label: "Nietos" },
              ],
            },
          },
          {
            type: "datetime",
            name: "born",
            label: "Fecha de nacimiento",
            dateFormat: "YYYY-MM-DD",
            ui: { dateFormat: "DD MMM YYYY" },
          },
          {
            type: "datetime",
            name: "died",
            label: "Fecha de fallecimiento",
            dateFormat: "YYYY-MM-DD",
            ui: { dateFormat: "DD MMM YYYY" },
          },
          {
            type: "string",
            name: "birthplace",
            label: "Lugar de nacimiento",
          },
          {
            type: "string",
            name: "occupation",
            label: "Ocupación",
          },
          {
            type: "image",
            name: "portrait",
            label: "Foto principal",
          },
          {
            type: "object",
            name: "photos",
            label: "Galería de fotos",
            list: true,
            fields: [
              { type: "image",  name: "src",     label: "Foto" },
              { type: "string", name: "caption", label: "Descripción" },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Biografía",
            isBody: true,
          },
          // Relationships stored as slug strings; resolved at query time
          {
            type: "string",
            name: "parents",
            label: "Padres (slugs)",
            list: true,
          },
          {
            type: "string",
            name: "children",
            label: "Hijos (slugs)",
            list: true,
          },
          {
            type: "string",
            name: "spouses",
            label: "Cónyuge(s) (slugs)",
            list: true,
          },
        ],
      },

      // ── Story ─────────────────────────────────────────────────────────
      {
        name: "story",
        label: "Historias",
        path: "src/content/stories",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Título",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "slug",
            label: "Slug (URL)",
            required: true,
          },
          {
            type: "string",
            name: "branch",
            label: "Familia",
            required: true,
            options: [
              { value: "breton",   label: "Bretón" },
              { value: "guerrero", label: "Guerrero" },
              { value: "both",     label: "Ambas familias" },
            ],
          },
          {
            type: "datetime",
            name: "date",
            label: "Fecha",
            dateFormat: "YYYY-MM-DD",
            ui: { dateFormat: "DD MMM YYYY" },
            required: true,
          },
          {
            type: "string",
            name: "author",
            label: "Autor",
          },
          {
            type: "image",
            name: "featuredImage",
            label: "Imagen destacada",
          },
          {
            type: "string",
            name: "relatedPeople",
            label: "Personas relacionadas (slugs)",
            list: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenido",
            isBody: true,
          },
        ],
      },
    ],
  },
});
