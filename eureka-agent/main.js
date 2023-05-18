((
  config = JSON.decode(pipy.load('config.json')),

  registry = JSON.decode(pipy.load('registry.json')),

  eureka = {
    host: '',
    path: ((
      ps = config?.eureka?.client?.serviceUrl?.indexOf?.('://'),
      pe = (ps > 0) && config?.eureka?.client?.serviceUrl?.indexOf?.('/', ps + 3),
    ) => (
      (ps < pe) && (eureka.host = config.eureka.client.serviceUrl.substring(ps + 3, pe)),
      pe > 0 ? config.eureka.client.serviceUrl.substring(pe) : ''
    ))(),
    registryJson: (() => (
      registry.instance.instanceId = config.eureka.instance.hostname + ':' + config.server.service + ':' + config.server.port,
      registry.instance.hostName = config.eureka.instance.hostname,
      registry.instance.app = config.server.service.toUpperCase(),
      registry.instance.ipAddr = config.server.ip,
      registry.instance.port['$'] = config.server.port,
      registry.instance.vipAddress = config.server.service,
      registry.instance.secureVipAddress = config.server.service,
      registry.instance.lastUpdatedTimestamp = registry.instance.lastDirtyTimestamp = new Date().getTime(),
      registry
    ))(),
  },

  registryTS = null,

  pipyJsonHash = '',

  selfInstanceId = eureka.registryJson.instance.instanceId,

  parseApps = dat => (
    (svcs = JSON.decode(dat), clustersConfigs = {}, routeRules = {}) => (
      (svcs?.applications?.application || []).map(
        a => (
          console.log('eureka service:', a.name),
          !a.name.toUpperCase().startsWith('PIPY') && (
            (a.instance || []).map(
              i => (
                i.status === 'UP' && (
                  !clustersConfigs[selfInstanceId + '/' + i.app] && (clustersConfigs[selfInstanceId + '/' + i.app] = {}),
                  !clustersConfigs[selfInstanceId + '/' + i.app].Endpoints && (clustersConfigs[selfInstanceId + '/' + i.app].Endpoints = {}),
                  clustersConfigs[selfInstanceId + '/' + i.app].Endpoints[i.ipAddr + ':' + i.port['$']] = ({
                    Weight: 100,
                    ShiftPath: true,
                    Http: i.vipAddress,
                    Https: i.secureVipAddress,
                  }),
                  (
                    (cluster = selfInstanceId + '/' + i.app) => (
                      routeRules[i.app] = (
                        {
                          Path: '/' + i.app.toLowerCase(),
                          Type: "Prefix",
                          Headers: null,
                          Methods: null,
                          TargetClusters: {
                            [cluster]: 100
                          },
                          AllowedServices: null
                        }
                      )
                    )
                  )()
                )
              )
            )
          )
        )
      ),
      { clustersConfigs, routeRules }
    )
  )(),

) => pipy({
  _config: null,
  _offline: false,
  _configJson: null,
})

.task('30s')
.onStart(
  () => new Data
)
.link('keepalive')

.pipeline('keepalive')
.onStart(
  () => (
    registryTS ?
      new Message({
        path: eureka.path + '/apps/' + eureka.registryJson.instance.app + '/' + eureka.registryJson.instance.instanceId + "?status=UP&lastDirtyTimestamp=" + registryTS,
        method: 'PUT',
        headers: {
          'Host': eureka.host,
          'Accept-Encoding': 'identity',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'DiscoveryIdentity-Name': 'Pipy',
          'DiscoveryIdentity-Id': config.server.ip
        }
      }) : new Data
  )
)
.branch(
  () => registryTS, (
    $=>$
    .muxHTTP(eureka.registryJson).to(
      $=>$.connect(eureka.host)
    )
    .replaceMessage(
      msg => (
        (msg?.head?.status < 200 || msg?.head?.status > 299) ? (_offline = true) : (_offline = false),
        new StreamEnd
      )
    )
    .branch(
      () => _offline, (
        $=>$
        .link('registry')
        .replaceMessage(
          () => (
            new StreamEnd
          )
        )
      ), (
        $=>$
      )
    )
  ), (
    $=>$
    .link('registry')
    .replaceMessage(
      () => new StreamEnd
    )
  )
)

.pipeline('registry')
.onStart(
  () => (
    registryTS = new Date().getTime(),
    eureka.registryJson.instance.lastDirtyTimestamp = registryTS,
    new Message({
      path: eureka.path +  '/apps/' + eureka.registryJson.instance.app,
      method: 'POST',
      headers: {
        'Host': eureka.host,
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'DiscoveryIdentity-Name': 'Pipy',
        'DiscoveryIdentity-Id': config.server.ip
      }
    }, JSON.encode(eureka.registryJson))
  )
)
.muxHTTP(eureka.registryJson).to(
  $=>$.connect(eureka.host)
)
.handleMessage(
  () => new StreamEnd
)

.task('30s')
.onStart(
  () => new Data
)
.link('apps')

.pipeline('apps')
.onStart(
  () => (
    _configJson = null,
    new Message({
      path: eureka.path + '/apps/',
      method: 'GET',
      headers: {
        'Host': eureka.host,
        'Accept-Encoding': 'identity',
        'Accept': 'application/json',
      }
    })
  )
)
.muxHTTP({}).to(
  $=>$.connect(eureka.host)
)
.replaceMessage(
  msg => (
    _configJson = ((
      cfg = JSON.decode(pipy.load('pipy.json')),
      eurekaCfg = parseApps(msg?.body),
      routeRules = [],
      cfgJson = '',
      jsonHash = '',
      version = new Date().getTime(),
      vhost = config.eureka.instance.hostname + ':' + config.server.port,
    ) => (
      Object.values(eurekaCfg?.routeRules || {}).map(
        v => (
          v.RateLimit = cfg.Outbound.TrafficMatches["0"][0].HttpServiceRouteRules["pipy-service"].RouteRules[0].RateLimit,
          routeRules.push(v)
        )
      ),
      cfg.Outbound.TrafficMatches["0"][0].Port = config.server.port,
      cfg.Outbound.TrafficMatches["0"][0].HttpServiceRouteRules["pipy-service"].RouteRules = routeRules,
      cfg.Outbound.TrafficMatches["0"][0].HttpServiceRouteRules[vhost] =
        cfg.Outbound.TrafficMatches["0"][0].HttpServiceRouteRules["pipy-service"],
      delete cfg.Outbound.TrafficMatches["0"][0].HttpServiceRouteRules["pipy-service"],
      cfg.Outbound.TrafficMatches["0"][0].HttpHostPort2Service[vhost] = vhost,
      cfg.Outbound.TrafficMatches["0"][0].HttpHostPort2Service[config.server.ip + ':' + config.server.port] = vhost,
      cfg.Outbound.TrafficMatches[config.server.port] = cfg.Outbound.TrafficMatches["0"],
      delete cfg.Outbound.TrafficMatches["0"],

      cfg.Outbound.ClustersConfigs = eurekaCfg.clustersConfigs,
      cfg.Spec.SidecarLogLevel = config.server.logLevel,
      cfgJson = JSON.stringify(cfg),
      jsonHash = algo.hash(cfgJson),
      registryTS && (jsonHash != pipyJsonHash) ? (
          pipyJsonHash = jsonHash,
          cfg.Ts = new Date(version).toString(),
          cfg.Version = version,
          cfg
      ) : null
    ))(),
    new StreamEnd
  )
)
.branch(
  () => _configJson && registryTS, (
    $=>$.replaceStreamEnd(
      () => new Message({version: registryTS}, JSON.stringify(_configJson, null, 2))
    )
    .use('util.js', 'push-config-json')
    .replaceMessage(
      () => new StreamEnd
    )
  ), (
    $=>$
  )
)

)()