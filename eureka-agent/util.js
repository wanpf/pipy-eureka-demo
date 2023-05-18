((
  config = JSON.decode(pipy.load('config.json')),

  repo = {
    host: '',
    path: ((
      ps = config?.repo?.url?.indexOf?.('://'),
      pe = (ps > 0) && config?.repo?.url?.indexOf?.('/', ps + 3),
      ) => (
        (ps < pe) && (repo.host = config.repo.url.substring(ps + 3, pe)),
        pe > 0 ? config.repo.url.substring(pe) : ''
      )
    )()
  }
) => (

pipy({
  _version: null,
})

.pipeline('push-config-json')
.replaceMessage(
  msg => (
    (_version = msg?.head?.version) ? (
      new Message({
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        method: 'POST',
        path: repo.path + '/repo-files/' + config?.repo?.name + '/config.json',
        headers: {
          'Host': repo.host
        }
      }, msg.body)
    ) : new StreamEnd
  )
)
.branch(
  () => _version, (
    $=>$
    .muxHTTP().to(
      $=>$.connect(repo.host)
    )
    .replaceMessage(
      msg => (
        console.log('post config.json, msg:', msg),
        (msg?.head.status != '201') ? (
          _version = null,
          new StreamEnd
        ) : (
          new Message({
            'Accept-Encoding': 'identity',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            method: 'PATCH',
            path: repo.path + '/repo/' + config?.repo?.name,
            headers: {
              'Host': repo.host
            }
          }, JSON.encode({version: '' + _version}))
        )
      )
    )
    .branch(
      () => _version, (
        $=>$
        .muxHTTP().to(
          $=>$.connect(repo.host)
        )
        .replaceMessage(
          msg => (
            console.log('commit repo, version, msg', _version, msg),
            new StreamEnd
          )
        )
      ), (
        $=>$
      )
    )
  ), (
    $=>$
  )
)

))()