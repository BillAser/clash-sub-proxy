import fs from 'fs';
import path from 'path';
import axios from 'axios';

const dataPath = path.resolve(process.cwd(), 'data.json');

async function readData() {
  console.log('data.json 路径:', dataPath);
  const json = await fs.promises.readFile(dataPath, 'utf-8');
  return JSON.parse(json);
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(400).send('缺少订阅ID');
      return;
    }

    let data;
    try {
      data = await readData();
    } catch (err) {
      console.error('读取data.json失败:', err);
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
    } catch (error) {
      console.error('代理请求失败:', error);
      res.status(500).send('# 代理请求失败');
    }
  } catch (error) {
    console.error('函数主逻辑异常:', error);
    res.status(500).send('服务器内部错误');
  }
}
