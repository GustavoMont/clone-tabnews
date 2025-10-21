function getOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "htpp://localhost:3000";
  }
  return process.env.VERCEL_URL;
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
