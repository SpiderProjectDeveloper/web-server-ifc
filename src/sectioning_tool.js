import {
	Vector3, MeshBasicMaterial, LineBasicMaterial, Mesh, Line, DoubleSide,
	BufferGeometry, BufferAttribute, BoxGeometry, PlaneGeometry, 
} from "three";

const TINY = 0.0001;
const PI = 3.14159265359;

const MAXPOLYS = 100;

const PLANEZISE = 200;
const LINEY = 0.01;
const BOXSIZEX = 0.75;
const BOXSIZEY = 0.01;
const BOXSIZEZ = 0.75;
const BOXY = 0.01;

export class SectioningTool 
{
	constructor(scene, pickableLayer, nonpickableLayer) 
	{
		this.scene = scene;
		this.pickableLayer = pickableLayer;
		this.nonpickableLayer = nonpickableLayer;
		this.capturedObject = null;
		this.plane = null;		

		const planeGeometry = new PlaneGeometry( PLANEZISE, PLANEZISE );
		const planeMaterial = new MeshBasicMaterial( { color: 0xddffee, side: DoubleSide } );
		this.plane = new Mesh( planeGeometry, planeMaterial );
		this.plane.rotation.x = PI / 2.0;
		
		this.plane.layers.set(this.pickableLayer);
		
		this.scene.add( this.plane );
		this.plane.userData = { type: 'plane' };
		this.planeUuid = this.plane.uuid;

		this.polys = [];
	}

	findEnclosingPoly( x, z ) 	// Finds the index of the poly that encloses a given point (x, z)
	{
		for( let i = 0 ; i < this.polys.length ; i++ ) {
			let points = this.polys[i].points;
			let r = isPointInside(x, z, points);
			if( r ) return i;
		}
		return -1;
	}

	numPolys() {
		return this.polys.length;
	}

	isCaptured() {
		return (this.capturedObject != null );
	}

	onMouseMove( raycaster ) 
	{
		if( this.capturedObject == null ) return;

		let found = raycaster.intersectObjects( this.scene.children ); // Casts a ray
		if( !found.length ) return;

		for( let iobj of found ) 
		{
			if( this.capturedObject.userData.type === 'box' )
			{
				if( iobj.object.userData.type !== 'box' && iobj.object.userData.type !== 'plane' ) continue;
				let poly = this.capturedObject.userData.poly;
				poly.moveVertex( iobj.point.x, iobj.point.z, this.capturedObject.userData.vertexNum );
				break;
			}		
			else if( this.capturedObject.userData.type === 'handle' ) 
			{
				if( iobj.object.userData.type !== 'box' && iobj.object.userData.type !== 'plane' ) continue;
				let poly = this.capturedObject.userData.poly;
				poly.moveFor( 
					iobj.point.x - this.capturedObject.position.x, 
					iobj.point.z - this.capturedObject.position.z
				);			
				break;
			}
		}
	}

	onMouseDown( raycaster, isRightButton = false ) 
	{
		if( this.capturedObject != null && !isRightButton ) 
		{
			this.capturedObject.material = SectioningPoly._material;
			this.capturedObject = null;
			return false;
		}
		let found = raycaster.intersectObjects( this.scene.children ); // Casts a ray
		if( !found.length ) return false;

		for( let obj of found ) 
		{
			if( obj.object.userData.type === 'box' ) 	// A box tapped
			{
				if( isRightButton ) {	// Right button must remove the box
					obj.object.userData.poly.removeVertex( obj.object.userData.vertexNum );
					return true;					
				}
	
				// Capturing the box
				this.capturedObject = obj.object;
				this.capturedObject.material = SectioningPoly._highlightMaterial;
				this.capturedObject.needsUpdate = true;
				return true;
			}

			if( obj.object.userData.type === 'handle' ) 
			{
				if( isRightButton ) {	// Right button removes the whole poly
					let poly = obj.object.userData.poly;
					poly.reset();
					if( poly.index !== null )
					this.polys.splice( poly.index, 1 );
					return true;					
				}
	
				// Left button captures the poly
				this.capturedObject = obj.object;
				this.capturedObject.material = SectioningPoly._highlightMaterial;
				this.capturedObject.needsUpdate = true;
				return true;
			}

			if( obj.object.userData.type === 'plane' && isRightButton ) // Creating a new poly
			{
				if( this.polys.length >= MAXPOLYS ) return;
				let poly = new SectioningPoly( {					 
					scene: this.scene,
					pickableLayer: this.pickableLayer, 
					nonpickableLayer: this.nonpickableLayer,
					x: obj.point.x, 
					z: obj.point.z,
					index: this.polys.length,
				}	);
				this.polys.push( poly );
				return;
			}
		}

		for( let iobj of found ) {
			if( iobj.object.userData.type === 'line' ) {
				let r = findSegmentPicked( 
					iobj.point.x, iobj.point.z, 
					iobj.object.geometry.attributes.position.array 
				);
				if( r == null ) return false;
				iobj.object.userData.poly.insertVertex(r['2'], iobj.point.x, iobj.point.z);
				return true;
			}
		}

		return false;
	}
	
}

SectioningTool._planeMaterial = new MeshBasicMaterial( { color: 0xffff00 } );

class SectioningPoly 
{
	constructor( props ) 
	{
		this.props = props;
		this.pickableLayer = props.pickableLayer;
		this.scene = ( typeof(props.scene) !== 'undefined' ) ? props.scene : null;
		this.index = ( typeof(props.index) !== 'undefined' ) ? props.index : null;
		this.line = null;
		this.boxes = null;
		this.handleBox = null;
		this.points = null;
		
		this.lineGeometry = new BufferGeometry();
		this.linePositions = new Float32Array( SectioningPoly._maxPoints * 3 ); // 3 vertices per point
		this.lineGeometry.setAttribute( 'position', new BufferAttribute( this.linePositions, 3 ) );

		this.boxGeometry = new BoxGeometry( BOXSIZEX, BOXSIZEY, BOXSIZEZ );

		this.init( { initByDefault: true } );
	}

	reset() 
	{
		if( this.scene !== null ) 
		{
			if( this.line !== null ) {
				this.scene.remove( this.line );
				this.line = null;
			}
			if( this.boxes !== null ) {
				for( let box of this.boxes ) {
					this.scene.remove( box );
				}
				this.boxes = null;
			}
			if( this.handleBox !== null ) {
				this.scene.remove( this.handleBox );
			}
		}		
	}

	init( params={} ) 
	{
		this.reset();

		if( params.initByDefault ) 
		{
			this.points = [];

			let x = ( typeof(this.props.x) !== 'undefined' ) ? this.props.x : 0;
			let z = ( typeof(this.props.z) !== 'undefined' ) ? this.props.z : 0;
			let size = ( typeof(this.props.size) !== 'undefined' ) ? this.props.size : 10;
			let halfSize = size/2;

			this.points.push( new Vector3( x + halfSize, LINEY, z + halfSize ) );
			this.points.push( new Vector3( x + halfSize, LINEY, z - halfSize ) );
			this.points.push( new Vector3( x - halfSize, LINEY, z - halfSize ) );
			this.points.push( new Vector3( x - halfSize, LINEY, z + halfSize ) );
		} else {
			;
		}
		
		for( let i = 0 ; i < this.points.length ; i++ ) {
			this.linePositions[i*3] = this.points[i].x;
			this.linePositions[i*3+1] = this.points[i].y;
			this.linePositions[i*3+2] = this.points[i].z;
		}
		this.linePositions[this.points.length*3] = this.points[0].x;
		this.linePositions[this.points.length*3+1] = this.points[0].y;
		this.linePositions[this.points.length*3+2] = this.points[0].z;
		this.lineGeometry.setDrawRange( 0, this.points.length+1 );
		this.lineGeometry.attributes.position.needsUpdate = true; 

		this.line = new Line( this.lineGeometry, SectioningPoly._material );
		this.line.layers.set(this.pickableLayer);

		this.boxes = [];
		for( let i = 0 ; i < this.points.length ; i++ ) 
		{
			let box = new Mesh( this.boxGeometry, SectioningPoly._material );
			box.position.set( this.points[i].x, BOXY, this.points[i].z );
			box.layers.set( this.pickableLayer );		
			box.userData = { poly: this, type: 'box', line: this.line, vertexNum: i };
			this.boxes.push( box );
		}

		// The handle (move / remove the whole)
		this.handleBox = new Mesh( this.boxGeometry, SectioningPoly._handleMaterial );
		let handleBoxPos = this.getMidPoint();
		this.handleBox.position.set( handleBoxPos.x, BOXY, handleBoxPos.z );
		this.handleBox.layers.set( this.pickableLayer );		
		this.handleBox.userData = { poly: this, type: 'handle' };

		this.line.userData = { 
			poly: this, type: 'line', points: this.points, boxes: this.boxes 
		};

		if( this.scene !== null ) {
			this.scene.add( this.line );
			for( let box of this.boxes ) {
				this.scene.add( box );
			}
			this.scene.add( this.handleBox );
		}
	}

	getMidPoint() {
		let x = 0, z = 0;
		for( let point of this.points ) {
			x += point.x;
			z += point.z;
		}
		return { x: x / this.points.length , z: z / this.points.length };
	}

	show(scene) {
		scene.add( this.line );
		for( let box of this.boxes ) {
			scene.add( box );
		}
		this.scene = scene;
	}

	hide() {
		if( this.scene != null ) {
			this.scene.remove( this.line );
			for( let box of this.boxes ) {
				this.scene.remove( box );
			}
			this.scene = null;
		}
	}

	insertVertex( pos, x, z ) 
	{
		if( this.points.length >= SectioningPoly._maxPoints ) return;

		this.points.splice( pos, 0, new Vector3( x, LINEY, z) );
		this.init( { useThisPoints: true } );
	}

	removeVertex( pos ) 
	{
		if( this.points.length < 4 ) return;

		this.points.splice( pos, 1 );
		this.init( { useThisPoints: true } );
	}


	moveVertex( x, z, vertexNum ) 
	{
		this.boxes[vertexNum].position.x = x;
		this.boxes[vertexNum].position.z = z;
		
		this.points[vertexNum].x = x;
		this.points[vertexNum].z = z;

		let array = this.line.geometry.attributes.position.array;
		array[ vertexNum*3 ] = x;
		array[ vertexNum*3+2 ] = z;

		if( vertexNum === 0 ) {
			let lastVertex = this.points.length; // Math.floor(ud.poly.numLinePoints - 1);
			array[ lastVertex*3 ] = x;
			array[ lastVertex*3+2 ] = z;	
		} 
		this.line.geometry.attributes.position.needsUpdate = true; 
	}

	moveFor( dx, dz ) {
		let array = this.line.geometry.attributes.position.array;
		for( let i = 0 ; i < array.length; i += 3 ) {
			array[i] += dx;
			array[i+2] += dz;
		}
		this.line.geometry.attributes.position.needsUpdate = true; 

		for( let box of this.boxes ) {
			box.position.x += dx;
			box.position.z += dz;
		} 

		for( let point of this.points ) {
			point.x += dx;
			point.z += dz;
		} 

		this.handleBox.position.x += dx;
		this.handleBox.position.z += dz;
	}

}

SectioningPoly._color = 0x0000ff;
SectioningPoly._highlightColor = 0xff0000;
SectioningPoly._handleColor = 0xdd7777;
SectioningPoly._material = new LineBasicMaterial( { color: SectioningPoly._color } );
SectioningPoly._highlightMaterial = new LineBasicMaterial( { color: SectioningPoly._highlightColor } );
SectioningPoly._handleMaterial = new LineBasicMaterial( { color: SectioningPoly._handleColor } );
SectioningPoly._maxPoints = 100;

function findSegmentPicked( x, z, pointsArray ) 
{
	points = [];
	for( let i = 0 ; i < pointsArray.length ; i+= 3 ) {
		points.push( { 'x': pointsArray[i], 'z': pointsArray[i+2] } );
	}

	function min(a,b) { return (a < b) ? a : b; }
	function max(a,b) { return (a > b) ? a : b; }

	for( let i = 0 ; i < points.length-1 ; i++ ) 
	{
		let p1 = points[i];
		let p2 = points[i+1];
		let x1 = p1.x;
		let z1 = p1.z;
		let x2 = p2.x;
		let z2 = p2.z;

		if( x < min(x1,x2) || x > max(x1,x2) ) continue;
		if( z < min(z1,z2) || z > max(z1,z2) ) continue;

		if( Math.abs(x1 - x2) < TINY ) {
			if( Math.abs(x1 - x) < TINY ) { 
				return { '1': i, '2': i+1 };
			}
			continue;
		}

		if( Math.abs(z1 - z2) < TINY ) {
			if( Math.abs(z1 - z) < TINY ) { 
				return { '1': i, '2': i+1 };
			}
			continue;
		}

		aSample = (z1 - z2) / (x1 - x2);
		bSample = z1 - aSample * x1;

		aTry = (z1 - z) / (x1 - x);
		bTry = z1 - aTry * x1;

		if( Math.abs(aSample - aTry) < TINY && Math.abs(bSample - bTry) < TINY ) {
			return { '1': i, '2': i+1 };
		}
	}

	return null;
}

function isPointInside(x, z, points) 
{
	let vmults= [];
	let lastIndex = points.length - 1;
	for( let i = 0 ; i <= lastIndex ; i++ ) 
	{
		let x1 = points[i].x;
		let z1 = points[i].z;
		let x2 = (i < lastIndex) ? points[i+1].x : points[0].x;
		let z2 = (i < lastIndex) ? points[i+1].z : points[0].z;
		let ax = x2 - x1;
		let az = z2 - z1;
		let bx = x - x1;
		let bz = z - z1;
		let vmult = ax*bz - bx*az;
		vmults.push(vmult)
	}

	let possum = 0, negsum = 0;
	for( let vmult of vmults ) {
		if( !(vmult < 0) ) possum++;
		if( !(vmult > 0) ) negsum++;
	}
	if( possum === vmults.length) return true;
	if( negsum === vmults.length) return true;
	return false;
}
