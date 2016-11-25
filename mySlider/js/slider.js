/**
 * Created by WebStorm.
 * @date   : 14-10-15
 * @author : qiwen.shi
 * @link   : 
 * @desc   :
 */
function Slider(opt) {
	var me = this;
	me.opt = $.extend({
		selector: '',
		speed: 300,
		datas:[],
		height:0,
		index:0,
		dependWidthSel:window,
		onBeforeSlideStart: function (index) {
			return true;
		},
		onSlideStart:function(){
		},
		onSlideEnd: function (index) {
		},
		onInitEnd:function(index,size){
		},
		autoPlay: false,
		interval: 3000,
		effect:'ease-out',
		loop:false,
		useTransitionEnd:true
	}, opt);
	me.init();
	me.opt.autoPlay&&me.autoPlay();
}
Slider.prototype = {
	constructor: Slider,
	init: function () {
		var me = this,
			opt=me.opt,
			datas=opt.datas,
			selector=opt.selector,
			$sel=$(selector||'.slider'),
			imgSize=$sel.find('ul img').length;
		me.$dependWidthSel=$(opt.dependWidthSel);
		me.width=me.$dependWidthSel.width();
		me.height=opt.height;
		me.loop=opt.loop;
		me.$sel=$sel.css({'overflow':'hidden','width':me.width+'px'});
		if(!imgSize){
			me.datas=[];
			me.datas=me.loop&&datas.length>1?me.datas.concat(datas[datas.length-1],datas,datas[0]):datas;
			me.length=me.datas.length;
			me.insertImgItems();
		}else{
			me.resetImgItems();
			me.initImgAttrs();
			me.length=$sel.find('li').length;
		}
		me.$con=$sel.find('ul');
		me.$con.width(me.width*me.length);
		me.initCSSPrefix();
		me.initEvents();
		me.initSeenItem(opt.index);
	},
	initEvents: function () {
		var startInfo,transitionEnd,
			resizeEvent='orientationchange' in window?'orientationchange':'resize',
			isTouchEn='ontouchstart' in window,
			me = this,
			$sel=me.$sel,
			$con = me.$con,
			$win=$(window),
			isTouched = false,
			isSliding = false,
			deltaX = 0;
		function touchStart(event) {
			var touches=event.touches||event.originalEvent.touches;
			if(touches&&touches.length>1)return;
			me.clearTransitionTime();
			var e = touches[0];
			startInfo = {
				pageX: e.pageX,
				pageY: e.pageY,
				time: Date.now()
			};
			deltaX = 0;
			isTouched = true;
			isSliding = false;
			me.opt.autoPlay&&me.stop();
		}

		function touchMove(event) {
			event.preventDefault();
			if (!isTouched) return;
			var index = me.index;
			var touches=event.touches||event.originalEvent.touches;
			var e = touches[0];
			deltaX = e.pageX - startInfo.pageX;
			if (!isSliding) {
				isSliding = Math.abs(deltaX) > Math.abs(e.pageY - startInfo.pageY);
			}
			if (isSliding) {
				var pos = (deltaX - index * me.width);
				me.$con.css(me.cssPrefix+'transform', 'translate3d(' + pos + 'px,0,0)');
			}
		}

		function touchEnd(event) {
			var touches=event.touches||event.originalEvent.touches;
			if(touches&&touches.length!==0)return;
			var index = me.index;
			var needSliding = (Date.now() - startInfo.time) < 250 && Math.abs(deltaX) > 20 || Math.abs(deltaX) > me.width / 3;
			if (isSliding) {
				if (me.opt.onBeforeSlideStart.call(me,index, deltaX)) {
					me.slideTo(index + ( needSliding? (deltaX < 0 ? 1 : -1) : 0 ));
				}
			}
			me.opt.autoPlay&&me.reStart();
			isTouched = false;
		}

		function reSize(){
			var width=me.$dependWidthSel.width(),
				loop=me.loop,
				length=me.length,
				index=me.index;
			me.width=width;
			$sel.width(width);
			$con.width(width*length).find('img').width(width);
			me.clearTransitionTime();
			if(loop&&index===0&&length>1){
				$con.css(me.cssPrefix+'transform','translate3d(-'+width*(length-2)+'px,0,0)');
				me.index=length-2;
			}else if(loop&&index===length-1&&length>1){
				$con.css(me.cssPrefix+'transform','translate3d(-'+width+'px,0,0)');
				me.index=1;
			}else{
				$con.css(me.cssPrefix+'transform','translate3d(-'+width*index+'px,0,0)');
			}
		}

		function resetTransition(){
			var $con=me.$con,
				loop=me.loop,
				length=me.length,
				index=me.index,
				width=me.width;
				if(loop&&length>1&&index===0){
					me.clearTransitionTime();
					$con.css(me.cssPrefix+'transform','translate3d(-'+width*(length-2)+'px,0,0)');
					me.index=length-2;
				}else if(loop&&length>1&&index===length-1){
					me.clearTransitionTime();
					$con.css(me.cssPrefix+'transform','translate3d(-'+width+'px,0,0)');
					me.index=1;
				}
				me.opt.onSlideEnd.call(me,loop&&length>1?me.index-1:me.index);
		}

		isTouchEn&&$con.on('touchstart', touchStart).on('touchmove', touchMove).on('touchend', touchEnd);
		if(me.opt.useTransitionEnd){
			transitionEnd = (function(){
				var transitionEndVendors={
					''			: 'transitionend',
					'webkit'	: 'webkitTransitionEnd',
					'Moz'		: 'transitionend',
					'O'			: 'otransitionend',
					'ms'		: 'MSTransitionEnd'
				};
				return transitionEndVendors[me.vendor];
			})();
			$con.on(transitionEnd,resetTransition);
		}
		$win.on(resizeEvent,reSize);
	},
	slideTo: function (index) {
		var me = this;
		if(index<0){
			index=0;
		}else if(index>me.length-1){
			index=me.length-1;
		}
		me.opt.onSlideStart.call(me);
		me.$con.css(me.cssPrefix+'transition','transform '+me.opt.speed + 'ms '+me.opt.effect).css(
			me.cssPrefix+'transform','translate3d(' + -(index * me.width) + 'px,0,0)'
		);
		if (me.index != index) {
			me.index = index;
		}
		!me.opt.useTransitionEnd&&me.resetTransition();
	},
	autoPlay: function () {
		var me = this;
		if(me.length===1)return;
		me.timer=setInterval(function () {
			if (!me.loop&&me.index == me.length - 1) {
				me.slideTo(0);
			} else {
				me.slideTo(me.index+1);
			}
		}, me.opt.interval);
	},
	next: function () {
		var me=this,autoPlay=me.opt.autoPlay;
		autoPlay&&me.stop();
		me.slideTo(me.index + 1);
		autoPlay&&me.reStart();
	},
	prev: function () {
		var me=this,autoPlay=me.opt.autoPlay;
		autoPlay&&me.stop();
		me.slideTo(me.index - 1);
		autoPlay&&me.reStart();
	},
	insertImgItems:function(){
		var imgItem,me=this,imgArry=[],datas=me.datas,imgAttrs='';
		imgArry.push('<ul>');
		for(var i= 0,len=datas.length;i<len;i++){
			imgAttrs+=' src="'+datas[i].src+'"';
			me.height&&(imgAttrs+=' height="'+me.height+'"');
			imgAttrs+=' width="'+me.width+'"';
			imgItem='<img'+imgAttrs+'/>';
			datas[i].url&&(imgItem='<a href="'+datas[i].url+'">'+imgItem+'</a>');
			imgArry.push('<li>'+imgItem+'</li>');
			imgAttrs='';
		}
		imgArry.push('</ul>');
		me.$sel.html(imgArry.join(''));
	},
	reStart:function(){
		this.autoPlay();
	},
	stop:function(){
		clearInterval(this.timer);
	},
	resetTransition:function(){
		var me=this,
			$con=me.$con,
			loop=me.loop,
			length=me.length,
			index=me.index,
			width=me.width;
		setTimeout(function(){
			if(loop&&length>1&&index===0){
				me.clearTransitionTime();
				$con.css(me.cssPrefix+'transform','translate3d(-'+width*(length-2)+'px,0,0)');
				me.index=length-2;
			}else if(loop&&length>1&&index===length-1){
				me.clearTransitionTime();
				$con.css(me.cssPrefix+'transform','translate3d(-'+width+'px,0,0)');
				me.index=1;
			}
			me.opt.onSlideEnd.call(me,loop&&length>1?me.index-1:me.index);
		},me.opt.speed);
	},
	resetImgItems:function(){
		var me=this,
			$ul=me.$sel.find('ul'),
			$lis=me.$sel.find('li');
		if(me.loop&&$lis.length>1){
			$ul.prepend($lis.last().clone()[0]);
			$ul.append($lis.first().clone()[0]);
		}
	},
	initImgAttrs:function(){
		var optHeight,$img,me=this,
			$imgs=me.$sel.find('ul img');
		optHeight=me.opt.height;
		$imgs.each(function(){
			$img=$(this);
			$img.attr('width',me.width);
			optHeight&&$img.attr('height',optHeight);
		});
	},
	initSeenItem:function(_index){
		var index,size,transX,me=this,
			$con=me.$con,
			length=me.length,
			loop=me.loop,
			width=me.width;
		if(index=+_index){
			index=loop&&length>1?index+1:index;
			transX=width*index;
		}else{
			index=loop&&length>1?1:0;
			transX=loop&&length>1?width:0;
		}
		$con.css(me.cssPrefix+'transform','translate3d(-'+transX+'px,0,0)');
		me.index=index;
		size=loop&&length>1?length-2:length;
		me.opt.onInitEnd.call(me,loop&&length>1?index-1:index,size);
	},
	initCSSPrefix:function(){
		var t,len,i=0,me=this,
			dummyStyle=document.createElement('div').style,
			vendor=(function(){
				var vendors='t,webkitT,MozT,msT,OT'.split(',');
				len=vendors.length;
				for(;i<len;i++){
					t=vendors[i]+'ransform';
					if(t in dummyStyle){
						return vendors[i].substring(0,vendors[i].length-1);
					}
				}
				return '';
			})();
		me.vendor=vendor;
		me.cssPrefix=vendor?'-'+vendor.toLowerCase()+'-':'';
	},
	clearTransitionTime:function(){
		var me=this;
		me.$con.css(me.cssPrefix+'transition','0ms');
	},
	goTo:function(index){
		var me=this,isLoop=me.loop&&me.length> 1,length=isLoop?me.length- 2:me.length;
		if(index>=0&&index<=length-1){
			me.slideTo(isLoop?index+1:index);
		}
	}
};
