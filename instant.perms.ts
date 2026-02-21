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
      create: "auth.id != null",
      delete: "false"
    }
  },
  votes: {
    allow: {
      view: "true",
      create: "auth.id != null",
      delete: "auth.id != null"
    }
  }
};
