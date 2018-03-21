const Router = require('express').Router
const router = new Router()

router.get('/', queryEvents)
router.get('/account/:address', findEventsByAccount)
router.get('/:id', findEventById)

function queryEvents (req, res, next) {
  req.logger.info(`Querying events: ${JSON.stringify(req.query)}`)

  req.model('Event').countAndFind(req.query)
    .skip(req.skip)
    .limit(req.limit)
    .sort(req.sort)
    .lean()
    .exec((err, events, count) => {
      if (err) { return next(err) }

      req.logger.verbose('Sending events to client')
      res.send({ events, count })
    })
}

function findEventById (req, res, next) {
  req.logger.info(`Finding event with id ${req.params.id}`)

  req.model('Event').findById(req.params.id)
    .then((event) => {
      if (!event) { return res.status(404).end() }

      req.logger.verbose('Sending event to client')
      return res.send(event)
    })
    .catch(err => next(err))
}

function findEventsByAccount (req, res, next) {
  req.logger.info(`Finding events with account ${req.params.address}`)

  req.query = { $or: [
    { 'metaData.returnValues._from': req.params.address },
    { 'metaData.returnValues._to': req.params.address },
    { 'metaData.returnValues._owner': req.params.address },
    { 'metaData.returnValues._spender': req.params.address }
  ]}

  return queryEvents(req, res, next)
}

module.exports = router
