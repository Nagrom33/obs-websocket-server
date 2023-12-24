require('dotenv').config();
const OBSWebSocket = require('obs-websocket-js').default;
const express = require('express');
const bodyParser = require('body-parser');

const obs = new OBSWebSocket();
const app = express();
const port = process.env.SERVER_PORT || 3000;

app.use(bodyParser.json());

const getSceneList = async () => {
  try {
    const response = await obs.call('GetSceneList');

    if (response.scenes && Array.isArray(response.scenes)) {
      const sceneNames = response.scenes.map(scene => scene.sceneName);
      return sceneNames;
    } else {
      console.error('Unexpected response structure from GetSceneList:', response);
      return [];
    }
  } catch (error) {
    console.error('Error getting scene list:', error);
    return [];
  }
};

app.get('/scene', async (req, res) => {
    const {currentProgramSceneName} = await obs.call('GetCurrentProgramScene');

    try {
        res.json({ currentProgramSceneName });
      } catch (error) {
        console.error('Error getting current');
        res.status(500).json({ error: 'Failed to switch scene' });
      }
})

app.get('/scenes', async (req, res) => {
    const sceneList = await getSceneList();

    try {
        res.json({ sceneList });
      } catch (error) {
        console.error('Error getting scenes');
        res.status(500).json({ error: 'Failed to switch scene' });
      }
})

app.post('/switchScene', async (req, res) => {
  const { sceneName } = req.body;
  const {currentProgramSceneName} = await obs.call('GetCurrentProgramScene');
  const sceneList = await getSceneList();


  console.log('Trying to switch:',sceneName);

  try {
    await obs.call('SetCurrentProgramScene', { 'sceneName': sceneName });
    console.log(`Switched to scene: ${sceneName}`);
    res.json({
        success: true,
        currentScene: sceneName
    });
  } catch (error) {
    res.status(500).json({
        error: 'Failed to switch scene',
        currentScene: currentProgramSceneName,
        availibleScenes: sceneList
    });
  }
});

obs.connect(`ws://${process.env.OBS_WEBSOCKET_IP}:${process.env.OBS_WEBSOCKET_PORT}`, process.env.OBS_WEBSOCKET_PASS)
  .then(() => {
    console.log('OBS is connected!');
  })
  .catch(err => {
    console.error('Failed to connect to OBS', err);
  });

obs.on('Identified', async () => {
    console.log('Identified...');
  // Now the OBS WebSocket is connected, and you can switch scenes or perform other actions.
  // For example, you can use the /switchScene endpoint by sending a POST request to http://localhost:3000/switchScene
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
