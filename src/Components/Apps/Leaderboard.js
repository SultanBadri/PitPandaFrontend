import React, { useEffect, useState } from "react";
import queryString from "query-string";
import StaticCard from "../Cards/StaticCard";
import MinecraftText from "../Minecraft/MinecraftText";
import Link from "../Link/Link";
import PageSelector from "../PageSelector/PageSelector";
import boards from "../../scripts/leaderboards";
import { withRouter } from "react-router-dom";
import axios from "axios";
import "./Leaderboard.css";

const defaultCategory = "gapples";

async function getLeaderboard({ category = defaultCategory, page = 0 }) {
  try {
    const pageRequest = await axios
      .get(`/api/leaderboard/${category}?page=${page}`)
      .catch((r) => r);
    const json = pageRequest.data;
    if (!json.success) return { error: json.error || "An error occured" };
    return json.leaderboard;
  } catch (e) {}
}

const getIndexerStatus = (() => {
  let lastUpdated = 0;
  return async () => {
    if (lastUpdated + 60e3 > Date.now()) return;
    lastUpdated = Date.now();
    const response = await axios.get("/api/indexer").catch((r) => r);
    const data = response.data;
    return data.data;
  };
})();

function getQuery(search) {
  let query = queryString.parse(search);
  return { category: query.category || defaultCategory, page: query.page || 0 };
}

function Leaderboard(props) {
  const [target, setTarget] = useState(getQuery(props.location.search));
  const [data, setData] = useState({
    entires: [],
    loadedType: defaultCategory,
    loadedPage: 0,
  });
  const [indexData, setIndexData] = useState({ online: false });

  const [hiddenLBs, setHiddenLBs] = useState(false);

  useEffect(() => {
    return props.history.listen(async (location) =>
      setTarget(getQuery(location.search))
    );
  });

  useEffect(() => {
    let alive = true;
    getLeaderboard(target)
      .then((stats) => {
        if (alive) {
          if (stats.error)
            setData({
              entires: [],
              loadedType: target.category,
              loadedPage: target.page,
            });
          else
            setData({
              entires: stats,
              loadedType: target.category,
              loadedPage: target.page,
            });
        }
      })
      .catch(console.error);
    getIndexerStatus()
      .then((indexer) => {
        if (alive && indexer) {
          if (indexer.error) console.log(indexer.error);
          else setIndexData(indexer);
        }
      })
      .catch(console.error);
    return () => (alive = false);
  }, [target]);

  function linkBuilder(n) {
    return `/leaderboard?category=${target.category}&page=${n - 1}`;
  }

  return (
    <>
      <h1
        className="page-header"
        style={{
          marginBottom: "100px",
          textAlign: "center",
        }}
      >
        Pit Panda Leade<span onClick={() => setHiddenLBs(!hiddenLBs)}>r</span>
        boards
      </h1>
      <div id="selector-two">
        <StaticCard
          title="Leaderboard Selector"
          style={{ maxWidth: "350px", minWidth: "250px" }}
        >
          {boards.ownKeys(hiddenLBs).map((key) => {
            const board = boards[key];
            return (
              <div key={key + target.category}>
                <Link href={`/leaderboard?category=${key}&page=0`}>
                  <MinecraftText
                    raw={(key === target.category ? "§f" : "") + board.short}
                  />
                </Link>
              </div>
            );
          })}
        </StaticCard>
      </div>
      <div className="container">
        <div
          className="selector-and-status-wrapper"
          style={{
            verticalAlign: "top",
            marginRight: "20px",
          }}
        >
          <StaticCard
            title="Leaderboard Selector"
            style={{ maxWidth: "350px", minWidth: "250px" }}
          >
            {boards.ownKeys(hiddenLBs).map((key) => {
              const board = boards[key];
              return (
                <div key={key + target.category}>
                  <Link href={`/leaderboard?category=${key}&page=0`}>
                    <MinecraftText
                      raw={(key === target.category ? "§f" : "") + board.short}
                    />
                  </Link>
                </div>
              );
            })}
          </StaticCard>
          <StaticCard
            title="Indexer Status"
            style={{ maxWidth: "350px", minWidth: "250px" }}
          >
            <MinecraftText
              className="text-title"
              raw={"Status: " + (indexData.online ? "§2Online" : "§4Offline")}
            />
            <br />
            {indexData.online ? (
              <>
                <MinecraftText
                  raw={`Players Queued: §6${indexData.remaingCount.toLocaleString()}`}
                />
                <br />
                <MinecraftText
                  raw={`Daily Players Indexed: §6${indexData.dailyCount.toLocaleString()}`}
                />
                <br />
                <MinecraftText
                  raw={`Rate: §6${
                    Math.round(1e5 / indexData.checkTimeout) / 1e2
                  } players/sec`}
                />
                <br />
                <MinecraftText
                  raw={`Daily Queue Time: §6${(() => {
                    const seconds = Math.round(
                      (indexData.dailyCount * indexData.checkTimeout) / 1e3
                    );
                    return `${Math.floor(seconds / 3600)}h ${Math.floor(
                      (seconds % 3600) / 60
                    )}m`;
                  })()}`}
                />
                <br />
                <MinecraftText
                  raw={`Remaining Queue Time: §6${(() => {
                    const seconds = Math.round(
                      (indexData.remaingCount * indexData.checkTimeout) / 1e3
                    );
                    return `${Math.floor(seconds / 3600)}h ${Math.floor(
                      (seconds % 3600) / 60
                    )}m`;
                  })()}`}
                />
                <br />
              </>
            ) : (
              ""
            )}
          </StaticCard>
        </div>

        <StaticCard title={boards[data.loadedType].displayName}>
          {data.entires.map((user, index) => (
            <div
              key={user.uuid}
              style={{
                borderTop: index !== 0 ? "2px solid #444" : "none",
                padding: "5px",
              }}
            >
              <MinecraftText
                style={{
                  width: "10%",
                  textAlign: "center",
                  display: "inline-block",
                }}
                text={`#${data.loadedPage * 100 + index + 1}`}
              />
              <Link href={`/players/${user.uuid}`}>
                <MinecraftText raw={user.name} style={{ width: "50%" }} />
              </Link>
              <MinecraftText
                text={boards[data.loadedType].transform(user.score)}
                style={{
                  width: "40%",
                  textAlign: "right",
                  paddingRight: "8px",
                }}
              />
            </div>
          ))}
          {data.entires.length ? (
            <PageSelector
              start={1}
              current={Number(target.page) + 1}
              linkBuilder={linkBuilder}
            />
          ) : (
            ""
          )}
        </StaticCard>
      </div>
      <div id="indexer-two">
        <StaticCard
          title="Indexer Status"
          style={{ maxWidth: "350px", minWidth: "250px" }}
        >
          <MinecraftText
            className="text-title"
            raw={"Status: " + (indexData.online ? "§2Online" : "§4Offline")}
          />
          <br />
          {indexData.online ? (
            <>
              <MinecraftText
                raw={`Players Queued: §6${indexData.remaingCount.toLocaleString()}`}
              />
              <br />
              <MinecraftText
                raw={`Daily Players Indexed: §6${indexData.dailyCount.toLocaleString()}`}
              />
              <br />
              <MinecraftText
                raw={`Rate: §6${
                  Math.round(1e5 / indexData.checkTimeout) / 1e2
                } players/sec`}
              />
              <br />
              <MinecraftText
                raw={`Daily Queue Time: §6${(() => {
                  const seconds = Math.round(
                    (indexData.dailyCount * indexData.checkTimeout) / 1e3
                  );
                  return `${Math.floor(seconds / 3600)}h ${Math.floor(
                    (seconds % 3600) / 60
                  )}m`;
                })()}`}
              />
              <br />
              <MinecraftText
                raw={`Remaining Queue Time: §6${(() => {
                  const seconds = Math.round(
                    (indexData.remaingCount * indexData.checkTimeout) / 1e3
                  );
                  return `${Math.floor(seconds / 3600)}h ${Math.floor(
                    (seconds % 3600) / 60
                  )}m`;
                })()}`}
              />
              <br />
            </>
          ) : (
            ""
          )}
        </StaticCard>
      </div>
    </>
  );
}

export default withRouter(Leaderboard);
