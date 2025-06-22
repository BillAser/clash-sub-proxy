import fs from 'fs';
import path from 'path';
import axios from 'axios';

const dataPath = path.resolve('./data.json');

async function readData() {
  const json = await fs.promises.readFile(dataPath, 'utf-8');
  return JSON.parse(json);
}

async function writeData(data) {
  await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    res.status(400).send('缺少订阅ID');
    return;
  }

  let data;
  try {
    data = await readData();
  } catch (err) {
    res.status(500).send('服务器数据读取失败');
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

    // 更新访问次数
    subInfo.accessed += 1;
    await writeData(data);
  } catch (error) {
    res.status(500).send('# 代理请求失败');
  }
}
