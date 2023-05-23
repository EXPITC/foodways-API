"use strict";
const { restos, products, users } = require("../../models");
require("dotenv").config();

exports.nearResto = async (req, res) => {
  try {
    const data = req.body;
    const { id } = req.user;
    const pathImg = "http://localhost:5001/img/";

    const user = await users.findOne({
      where: { id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    // lat,long
    let userLoc = user.location.split(" ");
    userLoc = [parseFloat(userLoc[0]), parseFloat(userLoc[1])];

    const allResto = await restos.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    async function getMenu(sellerId) {
      let menu = await products.findAll({
        where: { sellerId },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      });

      if (!menu[0]) return [];

      menu = menu.map((product) => product.dataValues);

      return menu.map((product) => ({
        ...product,
        img: pathImg + product.img,
      }));
    }

    const nearRestoScore = [];

    allResto.forEach((r) => {
      let loc = r.loc.split(" ");
      loc = [parseFloat(loc[0]), parseFloat(loc[1])];

      let lat = userLoc[0] - loc[0];
      let long = userLoc[0] - loc[0];

      if (lat < 0) lat = lat * -1;
      if (long < 0) long = long * -1;

      nearRestoScore.push({ score: lat + long, resto: r.dataValues });
    });

    let nearest = nearRestoScore.sort((a, b) => a.score - b.score);

    if (nearest.length > 5) {
      nearest = nearest.filter((_, i) => {
        if (i > 4) return;
        return _;
      });
    }

    nearest = await Promise.all(
      nearest.map(async (data) => {
        const restoLoc = data?.resto?.loc.split(" ");

        // Get resto menu
        const menu = await getMenu(data.resto.ownerId);

        // Get distance from user
        const direction_api = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLoc[1]}%2C${userLoc[0]}%3B${restoLoc[1]}%2C${restoLoc[0]}?alternatives=false&exclude=toll%2Cferry%2Cunpaved%2Ccash_only_tolls&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.MAPBOX_TOKEN}`;
        let response = await fetch(direction_api);
        response = await response.json();

        let distance = response.routes[0].distance;
        const km = 0.001;
        distance = (distance * km).toFixed(3).toString().replace(".", ",");

        // Get address resto
        const api_address = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${restoLoc[0]}&lon=${restoLoc[1]}`;
        response = await fetch(api_address);
        response = await response.json();

        const address = response.address.road;

        return {
          ...data,
          resto: { ...data.resto, img: pathImg + data.resto.img },
          menu,
          distance,
          address,
        };
      })
    );

    res.status(200).send({
      status: "success",
      data: {
        nearResto: nearest,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
