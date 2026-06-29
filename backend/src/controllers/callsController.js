exports.getTurnCredentials = (req, res) => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ];

  if (process.env.METERED_TURN_URL && process.env.METERED_USERNAME && process.env.METERED_CREDENTIAL) {
    iceServers.push({
      urls: process.env.METERED_TURN_URL,
      username: process.env.METERED_USERNAME,
      credential: process.env.METERED_CREDENTIAL
    });
  } else {
    // Free fallback TURN to ensure mobile calls over symmetric NAT work out-of-the-box
    iceServers.push({
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    });
    iceServers.push({
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    });
  }

  res.json({ iceServers });
};
