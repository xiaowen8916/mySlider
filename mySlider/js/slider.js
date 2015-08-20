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
		dependWidthSelector:'',
		selector: '',
		speed: 200,
		datas:[],
		height:0,
		index:0,
		onBeforeSlideStart: function (index) {
			return true;
		},
		onSlideStart:function(){
		},
		onSlideEnd: function (index) {
		},
		onSlideMove:function(index){
		},
		onInitEnd:function(index,size){
		},
		autoPlay: false,
		interval: 4000,
		effect:'ease',
		loop:false,
		defaultSrc:'',
		lazyLoad:false,
		lazyLoadSum:5,
		forceUpdateImgs:false,
		singleton:false
	}, opt);
	if(me.init())return QSlider.prototype.instance;
	me.opt.autoPlay&&me.autoPlay();
}
Slider.prototype = {
	constructor: Slider,
	instance:null,
	init: function () {
		var me = this,
			datas=me.opt.datas,
			selector=me.opt.selector,
			$dependWidthSel=$(me.opt.dependWidthSelector?me.opt.dependWidthSelector:window),
			$sel=$(selector||'.qt-slider'),
			imgSize=$sel.find('ul img').length,
			instance=Slider.prototype.instance;
		if(me.opt.singleton&&instance){
			me.initSeenItem(me.opt.index,instance);
			return true;
		}
		me.width=$dependWidthSel.width();
		me.height=me.opt.height;
		me.loop=me.opt.loop;
		me.$dependWidthSel=$dependWidthSel;
		me.$sel=$sel.css({'overflow':'hidden','width':me.width+'px'});
		if(me.opt.forceUpdateImgs||!imgSize){
			me.datas=[];
			me.datas=me.loop&&datas.length>1?me.datas.concat(datas[datas.length-1],datas,datas[0]):datas;
			me.length=me.datas.length;
			me.insertImgItems();
		}else{
			me.resetImgItems();
			me.initImgAttrs();
			me.length=$sel.find('li').length;
		}
		me.opt.lazyLoad&&me.initImgLazyLoad(me.opt.index);
		me.$con=$sel.find('ul');
		me.$con.width(me.width*me.length);
		me.initEvents();
		me.initSeenItem(me.opt.index);
		if(me.opt.singleton)QSlider.prototype.instance=this;
		return false;
	},
	initEvents: function () {
		var me = this,
			$sel=me.$sel,
			$con = me.$con,
			$win=$(window),
			isTouched = false,
			isSliding = false,
			deltaX = 0,
			startInfo;

		function touchStart(event) {
			if(event.touches&&event.touches.length>1)return;
			var e = event.touches ? event.touches[0] : event;
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
			var e = event.touches ? event.touches[0] : event;
			deltaX = e.pageX - startInfo.pageX;
			if (!isSliding) {
				isSliding = Math.abs(deltaX) > Math.abs(e.pageY - startInfo.pageY);
			}
			if (isSliding) {
				var pos = (deltaX - index * me.width);
				me.$con.css('-webkit-transform', 'translate3d(' + pos + 'px,0,0)');
			}
		}

		function touchEnd(event) {
			if(event.touches&&event.touches.length!==0)return;
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
			$con.width(width*length).find('ul img').width(width);
			if(loop&&index===0&&length>1){
				$con.css({'-webkit-transition':'0','transition':'0','-webkit-transform':'translate3d(-'+width*(length-2)+'px,0,0)'});
				me.index=length-2;
			}else if(loop&&index===length-1&&length>1){
				$con.css({'-webkit-transition':'0','transition':'0','-webkit-transform':'translate3d(-'+width+'px,0,0)'});
				me.index=1;
			}else{
				$con.css({'-webkit-transition':'0','transition':'0','-webkit-transform':'translate3d(-'+width*(loop&&length>1?index-1:index)+'px,0,0)'});
			}
		}

		$con.on('touchstart', touchStart).on('touchmove', touchMove).on('touchend', touchEnd);
		$win.on('resize',reSize);
	},
	slideTo: function (index) {
		var me = this;
		if(!me.loop||me.loop&&me.length===1){
			if(index<0){
				index=0;
			}else if(index>me.length-1){
				index=me.length-1;
			}
		}
		me.opt.onSlideStart.call(me);
		me.$con.css({
			'-webkit-transition-timing-function':me.opt.effect,
			'-webkit-transition-duration': me.opt.speed + 'ms',
			'-webkit-transform': 'translate3d(' + -(index * me.width) + 'px,0,0)'
		});
		if (me.index != index) {
			me.index = index;
			me.fixSlideIndex();
		}
		me.resetTransition();
	},
	autoPlay: function () {
		var me = this;
		me.timer=setInterval(function () {
			if(me.length===1)return;
			if (!me.loop&&me.index == me.length - 1) {
				me.slideTo(0);
			} else {
				me.next();
			}
		}, me.opt.interval);
	},
	next: function () {
		var me = this;
		if (me.index < me.length - 1) {
			me.slideTo(me.index + 1);
		}
	},
	prev: function () {
		var me = this;
		if (me.index > 0) {
			me.slideTo(me.index - 1);
		}
	},
	insertImgItems:function(){
		var imgItem,me=this,imgArry=[],datas=me.datas,imgAttrs='';
		imgArry.push('<ul>');
		for(var i= 0,len=datas.length;i<len;i++){
			imgAttrs+=' src="'+(me.opt.lazyLoad?me.opt.defaultSrc:datas[i].src)+'"';
			me.opt.lazyLoad&&(imgAttrs+=' data-lazy-src="'+datas[i].src+'"');
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
				$con.css({'-webkit-transition':'0','transition':'0','-webkit-transform':'translate3d(-'+width*(length-2)+'px,0,0)'});
				me.index=length-2;
			}else if(loop&&length>1&&index===length-1){
				$con.css({'-webkit-transition':'0','transition':'0','-webkit-transform':'translate3d(-'+width+'px,0,0)'});
				me.index=1;
			}else{
				$con.css({'-webkit-transition':'0','transition':'0'});
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
		var src,optHeight,$img,me=this,
			$imgs=me.$sel.find('ul img');
		optHeight=me.opt.height;
		$imgs.each(function(){
			$img=$(this);
			$img.attr('width',me.width);
			if(me.opt.lazyLoad){
				src=$img.attr('src');
				$img.attr({'data-lazy-src':src,'src':me.opt.defaultSrc});
			}
			optHeight&&$img.attr('height',optHeight);
		});
	},
	initSeenItem:function(_index,ins){
		var index,size,transX,me=ins||this,
			$con=me.$con||me.$sel.find('ul'),
			length=me.length||me.$sel.find('li').length,
			loop=me.loop||me.opt.loop,
			width=me.width||me.$dependWidthSel.width();
		if(index=+_index){
			index=loop&&length>1?index+1:index;
			transX=width*index;
		}else{
			index=loop&&length>1?1:0;
			transX=loop&&length>1?width:0;
		}
		$con.css('-webkit-transform','translate3d(-'+transX+'px,0,0)');
		me.index=index;
		size=loop&&length>1?length-2:length;
		me.opt.onInitEnd.call(me,loop&&length>1?index-1:index,size);
	},
	fixSlideIndex:function(){
		var me=this,
			index=me.index,
			length=me.length,
			loop=me.loop;
		if(loop&&length>1){
			if(index<1){
				index=length-3;
			}else if(index>length-2){
				index=0;
			}else{
				index-=1;
			}
		}
		me.opt.onSlideMove.call(me,index);
		me.opt.lazyLoad&&me.initImgLazyLoad(index);
	},
	initImgLazyLoad:function(index){
		var $img,$imgs,sum,low,high,i,l,size,isLoop,me=this;
		$imgs=me.$sel.find('ul img');
		size=$imgs.length;
		isLoop=me.loop&&size>1;
		isLoop&&(index+=1);
		if($imgs.eq(index).data('img-load')===true)return;
		sum=me.opt.lazyLoadSum;
		sum%2===0&&(sum+=1);
		if(sum<=$imgs.length){
			low=index-Math.floor(sum/2);
			high=index+Math.ceil(sum/2);
			i=low<=0?0:low;
			l=low<=0?sum:high;
		}else{
			i=0;
			l=$imgs.length;
		}
		for(;i<l;i++){
			$img=$imgs.eq(i);
			if(index===1&&isLoop) {
				!$imgs.eq(size-2).data('img-load')&&me.lazyLoadImg($imgs.eq(size-2));
				!$imgs.eq(size-1).data('img-load')&&me.lazyLoadImg($imgs.eq(size-1));
				!$imgs.eq(0).data('img-load')&&me.lazyLoadImg($imgs.eq(0));
			}else if(index===size-2&&isLoop){
				!$imgs.eq(1).data('img-load')&&me.lazyLoadImg($imgs.eq(1));
				!$imgs.eq(0).data('img-load')&&me.lazyLoadImg($imgs.eq(0));
				!$imgs.eq(size-1).data('img-load')&&me.lazyLoadImg($imgs.eq(size-1));
			}
			if($img.data('img-load')===true)continue;
			me.lazyLoadImg($img);
		}
	},
	lazyLoadImg:function($img){
		$img.attr({'src':$img.data('lazy-src'),'data-img-load':'true'});
	}
};