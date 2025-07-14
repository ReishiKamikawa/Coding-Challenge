const axios = require('axios');
const { db } = require('../firebase');
const { collection, doc, getDoc, setDoc, runTransaction } = require('firebase/firestore');

exports.getGithubInfo = async (req, res) => {
  const { repositoryId } = req.params;
  const githubToken = process.env.GITHUB_TOKEN;
  const headers = { Authorization: `token ${githubToken}` };

  try {
    const result = await runTransaction(db, async (transaction) => {
      const reposCacheRef = collection(db, 'githubCache');
      const cacheKey = `repo-${repositoryId}`;
      const cacheDocRef = doc(reposCacheRef, cacheKey);
      const cacheDoc = await transaction.get(cacheDocRef);

      if (cacheDoc.exists()) {
        const cacheData = cacheDoc.data();
        const cacheTime = cacheData.timestamp.toDate ? cacheData.timestamp.toDate() : new Date(cacheData.timestamp);
        const cacheAge = Date.now() - cacheTime.getTime();

        if (cacheAge < 10 * 60 * 1000) {
          return {
            fromCache: true,
            data: {
              repositoryId,
              ...cacheData.data,
              cacheHit: true
            }
          };
        }
      }

      const repoUrl = `https://api.github.com/repos/${repositoryId}`;

      const branchesRes = await axios.get(`${repoUrl}/branches`, { headers });
      const branches = branchesRes.data.map(b => ({ name: b.name, lastCommitSha: b.commit.sha }));

      const pullsRes = await axios.get(`${repoUrl}/pulls`, { headers });
      const pulls = pullsRes.data.map(p => ({ title: p.title, pullNumber: p.number }));

      const issuesRes = await axios.get(`${repoUrl}/issues`, { headers });
      const issues = issuesRes.data.map(i => ({ title: i.title, issueNumber: i.number }));

      const commitsRes = await axios.get(`${repoUrl}/commits`, { headers });
      const commits = commitsRes.data.map(c => ({ sha: c.sha, message: c.commit.message }));

      const responseData = {
        branches,
        pulls,
        issues,
        commits
      };

      transaction.set(cacheDocRef, {
        timestamp: new Date(),
        data: responseData
      });

      return {
        fromCache: false,
        data: {
          repositoryId,
          ...responseData
        }
      };
    });

    res.status(200).json(result.data);
  } catch (err) {
    console.error('Error fetching GitHub info:', err);
    res.status(500).json({ error: 'Failed to fetch GitHub info', details: err.message });
  }
};
