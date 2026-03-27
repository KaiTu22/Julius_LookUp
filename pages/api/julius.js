if (mode === "handle") {
  if (!platform || !handle) {
    return res.status(400).json({ error: "Requires platform and handle." });
  }
  const cleanHandle = handle.replace(/^@/, "");

  // Step 1: look up by handle to get the slug
  const handleTs   = Math.floor(Date.now() / 1000);
  const handlePath = `/influencers/export/social?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(cleanHandle)}&ts=${handleTs}`;
  const handleUrl  = `${JULIUS_BASE_URL}${handlePath}`;
  const handleSig  = generateSignature("GET", handleUrl, apiSecret);

  let handleRes;
  try {
    handleRes = await fetch(handleUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":   JULIUS_UA,
        "X-API-Key":    apiKey,
        "X-Signature":  handleSig,
      },
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
  }

  if (!handleRes.ok) {
    res.setHeader("Content-Type", "application/json");
    res.status(handleRes.status);
    return res.send(await handleRes.text());
  }

  const handleData = await handleRes.json();
  const resolvedSlug = handleData?.slug ?? handleData?.id;

  if (!resolvedSlug) {
    return res.status(404).json({ error: "Influencer not found for that handle." });
  }

  // Step 2: fetch full export using the slug (includes demographics)
  juliusPath  = `/influencers/${encodeURIComponent(resolvedSlug)}/export?ts=${Math.floor(Date.now() / 1000)}`;
  const fullSlugUrl = `${JULIUS_BASE_URL}${juliusPath}`;
  const slugSig     = generateSignature("GET", fullSlugUrl, apiSecret);

  let slugRes;
  try {
    slugRes = await fetch(fullSlugUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":   JULIUS_UA,
        "X-API-Key":    apiKey,
        "X-Signature":  slugSig,
      },
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
  }

  res.setHeader("Content-Type", "application/json");
  res.status(slugRes.status);
  return res.send(await slugRes.text());
