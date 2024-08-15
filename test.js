const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const prom = require('prom-client');
const packageInfo = require('./package.json');
const {Counter, Gauge} = require("prom-client");


class ServiceDiscovery {
    constructor(targets, metricPath) {
        this.targets = targets
        this.labels = {"__meta_metrics_path": metricPath}
    }
}

function registerRegistry(registryName) {
    const registry = new prom.Registry()
    registry.setDefaultLabels({'registry_name': registryName})

    const exampleCounter = new Counter({
        name: 'example_counter',
        help: 'Just an example Counter',
        labelNames: [],
        registers: [registry]
    })
    exampleCounter.inc(Math.random() * (20))

    const exampleGauge = new Gauge({
        name: 'example_gauge',
        help: 'Just an example Gauge',
        registers: [registry]
    })
    exampleGauge.set(Math.random() * (540))

    return registry
}


PORT = process.env.PORT || 8080
DNS_NAME = process.env.DNS_NAME || "localhost"

const registry1 = registerRegistry("first")
const registry2 = registerRegistry("second")
const registries = {
    "registry1": registry1,
    "registry2": registry2
}
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.get('/metrics/:registryName', async (req, res) => {
    res.setHeader('Content-Type', prom.register.contentType);
    if (req.params.registryName in registries) {
        registry = registries[req.params.registryName]
        res.status(200).send(registry.metrics());
    } else {
        res.status(404).send("what???")
    }

});
app.get('/service-discovery', async (req, res) => {
    res.setHeader('Content-Type', "application/json");
    const list = []
    for (let key in registries) {
        list.push(new ServiceDiscovery([DNS_NAME + ":" + PORT], "/metrics/" + key))
    }
    res.send(list);
});


app.listen(PORT, () => {
    console.log("Testing app listening on port " + PORT)
    console.log("Please see http://localhost:" + PORT + "/metrics")
})

