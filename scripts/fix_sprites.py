#!/usr/bin/env python3.5

import json, argparse

parser = argparse.ArgumentParser()
parser.add_argument( 'file' , help='The createjs sprite file to fix' )

args = parser.parse_args()

json_data = None

with open( args.file, 'r' ) as f:
    
    json_data = json.loads( f.read() )

    for frame in json_data[ 'frames' ]:

        w = frame[ 2 ]
        h = frame[ 3 ]
        
        if len( frame ) > 4:
            frame[ 4 ] = 0
        else:
            frame.append( 0 )

        # Add anchor points
        if len( frame ) > 5:
            frame[ 5 ] = int( w / 2 )
        else:
            frame.append( int( w / 2 ) )

        if len( frame ) > 6:
            frame[ 6 ] = int( h / 2 )
        else:
            frame.append( int( h / 2 ) )

with open( 'test', 'w+' ) as f:
    
    f.write( json.dumps( json_data ) )
