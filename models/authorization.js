function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = resource.id === user.id || can(user, "update:user:others");
  }

  return authorized;
}

function filterOutput(user, feature, output) {
  if (feature === "read:user") {
    return {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  }
  if (feature === "read:user:self") {
    if (user.id === output.id)
      return {
        id: output.id,
        email: output.email,
        username: output.username,
        features: output.features,
        created_at: output.created_at,
        updated_at: output.updated_at,
      };
  }
}

const authorization = { can, filterOutput };

export default authorization;
