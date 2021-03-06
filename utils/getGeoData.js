import { openDb, getStops, getShapes, getRoutes, importGtfs, getTrips } from 'gtfs';
import { ExpressError } from './ExpressError.js';

const sqlPath = './data/sql/gtfs';
const config = {
    sqlitePath: sqlPath,
    agencies: [
        {
            path: './data/'
        }
    ]
};

const db = await openDb(config);

export async function getGeoData(routeId, direction, routeOption) {
    const routes = await getRoutes({
        route_id: routeId
    });
    const route = routes[0];
    const allShapes = await getShapes(
        {
            route_id: routeId,
            direction_id: direction
        }
    );
    const newShapes = allShapes.map((shape) => {
        const x = shape.shape_id;
        return x
    });
    const uniqueShapes = [... new Set(newShapes)];
    const shapes = await getShapes(
        {
            route_id: routeId,
            direction_id: direction,
            shape_id: uniqueShapes[routeOption]
        },
        [],
        [
            ['shape_dist_traveled', 'ASC']
        ]
    );
    const coordinates = [];
    if (!shapes.length) {
        throw new ExpressError(404, "This route doesn't have any shapes stored in the database");
    }
    for (let shape of shapes) {
        let coordinate = [shape.shape_pt_lon, shape.shape_pt_lat];
        coordinates.push(coordinate);
    };
    const stops = await getStops({
        route_id: routeId,
        direction_id: direction
    });
    const routeNames = await getTrips(
        {
            route_id: routeId,
            direction_id: direction,
            shape_id: uniqueShapes
        },
        [
            'trip_headsign'
        ]
    );
    const uniqueNames = routeNames.filter((routeName, index) => {
        const _routeName = JSON.stringify(routeName);
        return index === routeNames.findIndex(obj => {
            return JSON.stringify(obj) === _routeName;
        });
    });
    return {
        route,
        coordinates,
        stops,
        uniqueShapes,
        uniqueNames
    }
}

const allRoutes = await getRoutes();
const showRoutes = [];
for (let route of allRoutes) {
    const shapes = await getShapes({
        route_id: route.route_id
    });
    if (shapes.length) {
        showRoutes.push(route);
    }
};
export async function getRoutesData(page, count) {
    const start = count * (page - 1);
    const end = count * page
    const routes = showRoutes.slice(start, end);
    const length = showRoutes.length;
    return { routes, length }
}

export async function searchRoute(routeShortName) {
    const routes = await getRoutes({
        route_short_name: routeShortName
    });
    const length = routes.length;
    return { routes, length };
}