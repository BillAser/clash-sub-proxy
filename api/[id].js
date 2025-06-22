import axios from 'axios';

const data = {
  "abc123": {
    "target": "https://xn--cp3a08l.com/api/v1/client/subscribe?token=681b72c6f13a9f75c0b03f1aebb5d733",
    "expiresAt": "2025-07-20T00:00:00Z",
    "maxAccess": 999999,
    "accessed": 0
  },
  "def456": {
    "target": "https://xn--cp3a08l.com/api/v1/client/subscribe?token=681b72c6f13a9f75c0b03f1aebb5d733",
    "expiresAt": "2026-06-20T00:00:00Z",
    "maxAccess": 999999,
    "accessed": 0
  }
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    res.status(400).send('缺少订阅ID');
    return;
  }

  const subInfo = data[id];
  if (!subInfo) {
    res.status(404).send('无效订阅ID');
    return;
  }

  const now = new Date();
  if (now > new Date(subInfo.expiresAt)) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('# 订阅已过期，请联系管理员续费');
    return;
  }

  if (subInfo.accessed >= subInfo.maxAccess) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('# 订阅访问次数已用尽，请联系管理员续费');
    return;
  }

  try {
    const response = await axios.get(subInfo.target);
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(response.data);

    // 注意：此处的 accessed 不会持久化，仅用于未来扩展参考
    subInfo.accessed += 1;
  } catch (error) {
    console.error('代理请求失败:', error);
    res.status(500).send('# 代理请求失败');
  }
}
