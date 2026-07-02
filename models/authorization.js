import { InternalServerError } from "infra/errors.js";

const AVAILABLE_FEATURES = [
  // USERS
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",
  "create:user",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // MIGRATIONS
  "create:migration",
  "read:migration",

  // DATABASE
  "read:database",
  "read:database:complete",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = resource.id === user.id || can(user, "update:user:others");
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
  if (feature === "read:user:self") {
    if (user.id === resource.id)
      return {
        id: resource.id,
        email: resource.email,
        username: resource.username,
        features: resource.features,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
  }
  if (feature === "read:activation_token") {
    return {
      id: resource.id,
      created_at: resource.created_at,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
      user_id: resource.user_id,
      updated_at: resource.updated_at,
    };
  }
  if (feature === "read:session") {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        user_id: resource.user_id,
        token: resource.token,
        expires_at: resource.expires_at,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === "read:database") {
    const { updated_at, dependencies } = resource;
    const filteredOutput = {
      updated_at: updated_at,
      dependencies: {
        database: {
          max_connections: dependencies.database.max_connections,
          opened_connections: dependencies.database.opened_connections,
        },
      },
    };
    if (can(user, "read:database:complete")) {
      filteredOutput.dependencies.database.version =
        dependencies.database.version;
    }

    return filteredOutput;
  }
  if (["read:migration", "create:migration"].includes(feature)) {
    return resource.map(({ timestamp, name }) => ({ timestamp, name }));
  }
}

function validateUser(user) {
  if (!user || !("features" in user) || !Array.isArray(user.features)) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !AVAILABLE_FEATURES.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma `feature` conhecida no model `authorization`",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `resource` conhecida no model `authorization.filterOutput`",
    });
  }
}

const authorization = { can, filterOutput };

export default authorization;
