import express from "express";
import path from "path";

import React from "react";
import Client from "oc-client";
import Helmet from "react-helmet";
import { renderToString } from "react-dom/server";
import { StaticRouter, matchPath } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import routes from "./routes";
import Layout from "./components/Layout";
import createStore, { initializeSession } from "./store";

const app = express();
 
var client = new Client({
  registries: { serverRendering: 'http://localhost:3030/'},
  components: {
    'hello-world': '1.0.0',
  }
});

app.use( express.static( path.resolve( __dirname, "../dist" ) ) );

app.get( "/*", ( req, res ) => {
    const context = { };
    const store = createStore( );

    store.dispatch( initializeSession( ) );

    const dataRequirements =
        routes
            .filter( route => matchPath( req.url, route ) ) // filter matching paths
            .map( route => route.component ) // map to components
            .filter( comp => comp.serverFetch ) // check if components have data requirement
            .map( comp => store.dispatch( comp.serverFetch( ) ) ); // dispatch data requirement

    Promise.all( dataRequirements ).then( ( ) => {
        client.init({
            headers: { 'accept-language': 'en-US'}
          }, function(error, responses){
            console.log(error);
            // => something like null or Error making request to registry
            console.log("response:");
            console.log(responses);
            const header = responses['hello-world'];
            const jsx = (
                <ReduxProvider store={ store }>
                    <StaticRouter context={ context } location={ req.url }>
                        <Layout />
                    </StaticRouter>
                </ReduxProvider>
            );
            const reactDom = renderToString( jsx );
            const reduxState = store.getState( );
            const helmetData = Helmet.renderStatic( );            
            // => something like { hello: '<b>hello</b>'}
            res.writeHead( 200, { "Content-Type": "text/html" } );
            res.end( htmlTemplate( header, reactDom, reduxState, helmetData ) );            
          });

    } );
} );

app.listen( {{cookiecutter.port}} );

function htmlTemplate( header, reactDom, reduxState, helmetData ) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            ${ helmetData.title.toString( ) }
            ${ helmetData.meta.toString( ) }
            <title>React SSR</title>
        </head>
        
        <body>
            ${ header }
            <div id="app">
                ${ reactDom }
            </div>
            <script>
                window.REDUX_DATA = ${ JSON.stringify( reduxState ) }
            </script>
            <script src="./app.bundle.js"></script>
        </body>
        </html>
    `;
}
