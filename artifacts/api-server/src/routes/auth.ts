import { Router } from "express";

const router = Router();

router.get("/auth/session", (req, res) => {
  const replUserId = req.headers["x-replit-user-id"] as string | undefined;
  const replUserName = req.headers["x-replit-user-name"] as string | undefined;
  const replUserImage = req.headers["x-replit-user-profile-image"] as string | undefined;

  if (!replUserId || !replUserName) {
    res.status(401).json({ user: null });
    return;
  }

  res.json({
    user: {
      id: replUserId,
      name: replUserName,
      profileImage: replUserImage ?? null,
    },
  });
});

router.get("/auth/login", (req, res) => {
  const redirect = (req.query.redirect as string) || "/candidate-dashboard";
  res.redirect(`https://replit.com/auth_with_repl_site?domain=${req.hostname}&redirect=${encodeURIComponent(redirect)}`);
});

router.post("/auth/logout", (req, res) => {
  res.json({ ok: true });
});

export default router;
