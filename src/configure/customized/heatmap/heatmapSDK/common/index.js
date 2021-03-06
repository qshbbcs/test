import { domParentList } from '../../lib/getField.js'
import Util from '../../../../../lib/common/index.js'
import 'intersection-observer'
var rootNodeRE = /^(?:body|html)$/i

function pathContrast (eventPath, elePath) {
  eventPath = eventPath.split('<body')[0]
  elePath = elePath.split('<body')[0]
  var eventPathArray = eventPath.split('<')
  var elePathArray = elePath.split('<')
  if (eventPathArray[0] === elePathArray[0]) {
    for (var i = 1; i < eventPathArray.length; i++) {
      if (eventPathArray[i].indexOf('|') > -1 && elePathArray[i].indexOf('|') > -1) {
        var eventPathIndex = eventPathArray[i].split('|')[1]
        var elePathIndex = elePathArray[i].split('|')[1]
        if (eventPathIndex !== elePathIndex) {
          return false
        }
      }

      if (eventPathArray[i].split('.')[0] !== elePathArray[i].split('.')[0]) {
        return false
      }
    }
    return true
  }
  return false
}

function parseEvent (path) {
  var eleObj = parserDom(path)
  if (eleObj.length === 0) {
    return
  }
  var baseEle = eleObj[0].elePath
  try {
    if (baseEle.indexOf('#') > -1) {
      baseEle = '#' + baseEle.split('#')[1]
    }
    var eleList = Util.selectorAllEleList(baseEle) // document.querySelectorAll(baseEle)
    for (var i = 0; i < eleList.length; i++) {
      var ele = eleList[i]
      if (rootNodeRE.test(ele.nodeName)) {
        return document.body
      }
      var elePath = domParentList(ele)
      var eleIndex = parserDom(elePath).index
      if (elePath === path || (pathContrast(elePath, path) === true && eleObj.index === eleIndex)) {
        return eleList[i]
      }
    }
  } catch (e) { }
  return null
}
/**
 * [parserDom description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
function parserDom (path) {
  var eleList = []
  if (path.indexOf('<') < 0) {
    return [{
      elePath: path.split('|')[0],
      index: path.split('|')[1]
    }]
  }
  var pathObj = path.split('<')
  for (var i = 0; i < pathObj.length; i++) {
    var elelPath = pathObj[i].split('|')[0]
    var eleIndex = pathObj[i].split('|')[1]
    eleList.push({
      elePath: elelPath,
      index: eleIndex
    })
  }
  return eleList
}

/**
 * [eleCss description]??????????????????css????????????????????????
 * @param  {[type]} element  [description]??????dom
 * @param  {[type]} property [description]css??????
 * @return {[type]} value [description]css???????????????
 */
function eleCss (element, property) {
  var len1, prop, props, q
  if (!element) {
    return
  }
  if (typeof property === 'string') {
    return getConstantStyle(element, property)
  } else if (Array.isArray(property)) {
    props = {}
    for (q = 0, len1 = property.length; q < len1; q++) {
      prop = property[q]
      props[prop] = getConstantStyle(element, prop)
    }
    return props
  }
}
function eleScroll (ele) {
  var scrollTop = 0
  var scrollLeft = 0
  while (ele != null && ele !== document.body) {
    if (ele.nodeType === 1) {
      scrollTop += ele.scrollTop
      scrollLeft += ele.scrollLeft
    }
    ele = ele.parentNode
  }
  return {
    scrollLeft: scrollLeft,
    scrollTop: scrollTop
  }
}
/**
 * [parserDom description]?????????????????????????????????????????????????????????/??????
 * @param  {[type]} ele [description] ??????Dom??????
 * @return {[type]} obj [description] ???????????????????????????/??????
 */
function eleOffset (ele) {
  var realTop = 0
  var realLeft = 0
  var elemHidden = false
  var isFixed = false

  while (ele != null) {
    realTop += ele.offsetTop
    realLeft += ele.offsetLeft

    if (!elemHidden) {
      elemHidden = !!(eleCss(ele, 'display') === 'none' || eleCss(ele, 'width') === '0px' || eleCss(ele, 'height') === '0px')
    }

    if (eleCss(ele, 'position') === 'fixed') {
      isFixed = true
    }
    ele = ele.offsetParent
  }
  if (isFixed === true) {
    realTop += document.documentElement.scrollTop || document.body.scrollTop
    realLeft += document.documentElement.scrollLeft || document.body.scrollLeft
  }
  return {
    top: realTop,
    left: realLeft,
    hidden: elemHidden,

  }
}

/**
 * [offsetParent description] ???????????????
 * @return {[type]} [description]
 */
// function eleOffsetParent (elem) {
//   var parent
//   while (elem && !elem.offsetParent) {
//     elem = elem.parentNode
//     if (elem === document.body) {
//       break
//     }
//   }
//   if (!elem) return document.body
//   parent = elem.offsetParent || document.body
//   while (parent && !rootNodeRE.test(parent.nodeName) && eleCss(parent, 'position') === 'static') {
//     parent = parent.offsetParent
//   }
//   return parent
// }
/**
 * [elementPostion description] ???????????????????????????????????????
 * @param  {[type]} elem [description]????????????
 * @return {[type]}     [description]x-????????? number y-????????? number hidden-?????????????????? Bloon
 */
function elementPostion (elem) {
  var position = {
    top: 0,
    left: 0,
    hidden: true
  }

  if (!elem) {
    return position
  }
  var elePosition = eleOffset(elem)
  if (!elePosition) {
    return position
  }
  position = {
    top: elePosition.top,
    left: elePosition.left,
    hidden: elePosition.hidden,
    scrollLeft: elePosition.scrollLeft,
    scrollTop: elePosition.scrollTop
  }

  return position
}
/**
 * [isEmbedded description] ????????????????????????
 * @return {Boolean} [description] true - ????????? false - ?????????
 */
function isEmbedded (key) {
  var urlParam = pipParam(pipParam(Util.GetUrlParam(key), '/'), '#')
  if (window.top !== window.self && urlParam === 'true') {
    return true
  }
  return false
}

/**
 * [isElmentReady description] ??????dom??????????????????
 * ?????????dom????????????????????????????????????img????????????
 * img???????????????window.resize????????????
 * @return {Boolean} [description]
 */
function isElmentReady () {
  if (document && document.documentElement && document.getElementsByTagName && document.getElementById && document.body && document.documentElement.scrollWidth !== 0) {
    return true
  } else {
    return false
  }
}

/**
 * [isParent description] ???????????????????????????????????????????????????
 * @param  {[type]}  ele       [description] ????????????
 * @param  {[type]}  parentEle [description] ????????????
 * @return {Boolean}           [description]
 */
function isParent (ele, parentEle) {
  // ??????????????????BODY????????????
  while (ele && ele.tagName.toUpperCase() !== 'BODY' && ele.tagName.toUpperCase() !== 'HTML') {
    if (Util.paramType(parentEle) === 'Array') {
      for (var i = 0; i < parentEle.length; i++) {
        if (ele === parentEle[i]) {
          return true
        }
      }
    } else {
      if (ele === parentEle) {
        return true
      }
    }
    ele = ele.parentNode
  }
  return false
}
/**
 * [getConstantStyle description] ??????????????????????????????
 * @param  {[type]} el     [description] ??????
 * @param  {[type]} pelStr [description] ????????????
 * @return {[type]}        [description]
 */
function getConstantStyle (el, pelStr) {
  var w = document.defaultView
  if (w && w.getComputedStyle) {
    return document.defaultView.getComputedStyle(el, null)[pelStr]
  } else {
    return el.currentStyle[pelStr]
  }
}
/**
 * [pipParam description] ?????????????????????????????????
 * @param  {[type]} param [description]
 * @return {[type]}       [description]
 */
function pipParam (param, str) {
  if (param.charAt(param.length - 1) === str) {
    param = param.substr(0, param.length - 1)
  }
  if (param.charAt(param.length - 1) === str) {
    param = param.substr(0, param.length - 1)
  }
  return param
}
/**
 * addObserver
 * ????????????????????????
 * @param {*} ele 
 * @param {*} callback ??????????????????,????????????
 */
function addObserver (ele, callbackFn, removeFn) {
  var callback = function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var entriesEle = entries[i].target || entries[i].srcElement
      if (entriesEle === ele && entries[i].intersectionRatio > 0) {
        callbackFn.call(callbackFn, entries)
      } else if (entries[i].intersectionRatio <= 0) {
        removeFn.call(removeFn, entries)
      }
    }
  }
  var io = new IntersectionObserver(callback, {
    threshold: [0.01]
  });
  io.observe(ele)
}
function eleIsHidden (ele) {
  if (eleCss(ele, 'display') === 'none' || eleCss(ele, 'width') === '0px' || eleCss(ele, 'height') === '0px') {
    return true
  }
  return false
}
function offset (curEle) {
  var totalLeft = null, totalTop = null, par = curEle;
  var eleTable = null
  //?????????????????????????????????????????????
  // totalLeft += curEle.offsetLeft;
  // totalTop += curEle.offsetTop
  //??????????????????body???????????????????????????????????????????????????????????????
  while (par) {
    if (par.tagName === 'TABLE') {
      eleTable = par
    }
    if (navigator.userAgent.indexOf("MSIE 8.0") === -1) {
      //??????????????????????????????
      totalLeft += par.clientLeft;
      totalTop += par.clientTop
    }
    //????????????????????????????????????
    totalLeft += par.offsetLeft;
    totalTop += par.offsetTop
    par = par.offsetParent;
  }

  return {
    left: totalLeft,
    top: totalTop,
    eleTable: eleTable
  }
}
export { elementPostion, eleCss, parseEvent, parserDom, domParentList, isEmbedded, isElmentReady, isParent, getConstantStyle, pipParam, addObserver, eleIsHidden, offset, eleScroll, eleOffset }
