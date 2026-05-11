import type { BlockSchema } from "@plone/types";

const PropertyDescriptionSchema = (): BlockSchema => ({
  title: "Property description",
  fieldsets: [
    { id: "default", title: "Description", fields: ["heading", "body"] },
  ],
  properties: {
    heading: { title: "Heading", type: "string" },
    body: { title: "Body", type: "string", widget: "textarea" },
  },
  required: [],
});

export default PropertyDescriptionSchema;
