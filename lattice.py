# Lattice Class
import numpy as np

class Lattice:
    def __init__( self, num_layers ):
        self.num_layers: int = num_layers
        
        # Initialising array
        self.array = np.zeros( self.get_number_of_nodes(), dtype=np.float64 )

    def get_number_of_nodes( self ):
        # a = 1 to num_layers case of an incrementing series
        return int( ( ( 1 + self.num_layers ) * self.num_layers ) / 2 )

    def get_number_of_nodes_up_to_layer( self, layer_num : int ):
        # a = 1 to layer_num case of an incrementing series
        output = 1

        if layer_num != 0:
            output = int( ( ( 1 + layer_num ) * layer_num ) / 2 )

        return output

    def is_index_valid( self, index : int ):
        return ( index < self.get_number_of_nodes ) and ( index >= 0 )

    def get_node_value( self, index : int ):
        output = None

        if self.is_index_valid( index ): 
            output = self.array[ index ]
        else:
            output = None

        return output

    def get_node_index_by_layer_index( self, layer_num : int, index_in_layer : int ):
        output : float = None

        if index_in_layer > layer_num + 1:
            output = None
        else:
            index = self.get_number_of_nodes_up_to_layer( layer_num ) + index_in_layer

        return output

    def get_node_value_by_layer_index( self, layer_num : int, index_in_layer : int ):
        return self.get_node_value( [ self.get_node_index_by_layer_index( layer_num, index_in_layer ) ] )

    def set_node_value( self, index : int, value : float ):
        if self.is_index_valid( index ):
            self.array[ index ] = value

    def get_node_layer( self, index : int ):
        output = 0

        while index < self.get_number_of_nodes_up_to_layer( layer_num ) and layer_num < self.num_layers:
            output++

        return output

    def does_node_have_child( self, index : int ):
        output = True
        layer_num = self.get_node_layer( index )

        if layer_num == self.num_layers - 1:
            output = False

        return output

    def get_node_down_child( self, index : int ):
        output = None

        if self.does_node_have_child( index ):
            output = 0
            node_layer_num = self.get_node_layer( index )
            output += ( node_layer_num + 1 )

        return output

    def get_node_up_child( self, index : int ):
        output = None

        if self.does_node_have_child( index ):
            output = 0
            node_layer_num = self.get_node_layer( index )
            output += ( node_layer_num + 1 ) + 1

        return output

    # TODO: Define parent logic

