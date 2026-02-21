import { ADMIN_EMAIL } from "./lib/constants";

export default {
  "$files": {
    allow: {
      view: "true",
      create: "auth.id != null",
      delete: "false"
    }
  },
  memes: {
    allow: {
      view: "true",
      create: `auth.id != null && auth.id == data.authorId`,
      update: `auth.email == '${ADMIN_EMAIL}'`,
      delete: "false"
    }
  },
  votes: {
    allow: {
      view: "true",
      create: `auth.id != null && auth.id == data.userId`,
      delete: `auth.id != null && auth.id == data.userId`
    }
  },
  templates: {
    allow: {
      view: "true",
      create: `auth.email == '${ADMIN_EMAIL}'`,
      update: `auth.email == '${ADMIN_EMAIL}'`,
      delete: `auth.email == '${ADMIN_EMAIL}'`
    }
  }
};
