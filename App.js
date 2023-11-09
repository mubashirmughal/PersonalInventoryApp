import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  View,
  Text,
  Button,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "react-native-image-picker";

const Stack = createStackNavigator();

// Styles for consistent UI across screens
const styles = {
  // container style for the entire screen
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  // Common text style
  text: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  // Common button style
  button: {
    marginVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#007bff",
    borderRadius: 10,
  },
  // Style for button text
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Style for item container in the list
  itemContainer: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  // Style for text within item containers
  itemText: {
    fontSize: 18,
  },
  // Style for images
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
};

// HomeScreen: Displays the inventory list
function HomeScreen({ navigation }) {
  // State to store the inventory items
  const [inventory, setInventory] = useState([]);

  // Load data from AsyncStorage when the screen is mounted
  useEffect(() => {
    loadData();
  }, []);

  // Load inventory data from AsyncStorage
  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem("inventory");
      if (data !== null) {
        setInventory(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Initialize the inventory if it doesn't exist in AsyncStorage
  useEffect(() => {
    initializeInventory();
  }, []);

  // Initialize inventory data in AsyncStorage
  const initializeInventory = async () => {
    const data = await AsyncStorage.getItem("inventory");
    if (data === null) {
      await AsyncStorage.setItem("inventory", JSON.stringify([]));
    }
  };

  // Navigate to the ItemDetailScreen for editing an item
  const handleEditItem = (item) => {
    navigation.navigate("ItemDetail", { item });
  };

  // Delete an item from the inventory
  const handleDeleteItem = async (item) => {
    try {
      const existingInventory = await AsyncStorage.getItem("inventory");
      if (existingInventory) {
        const updatedInventory = JSON.parse(existingInventory).filter(
          (existingItem) => existingItem.id !== item.id
        );
        await AsyncStorage.setItem(
          "inventory",
          JSON.stringify(updatedInventory)
        );
        loadData();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inventory List</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ItemDetail", { newItem: true })}
      >
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>
      {inventory.length > 0 ? (
        inventory.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text style={styles.itemText}>{item.name}</Text>
            {item.image && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ItemImageDetail", { image: item.image })
                }
              >
                <Image source={{ uri: item.image }} style={styles.image} />
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleEditItem(item)}
              >
                <Text style={styles.buttonText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleDeleteItem(item)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text>No items in the inventory</Text>
      )}
    </View>
  );
}

// ItemDetailScreen: Allows users to add or edit an item
function ItemDetailScreen({ route, navigation }) {
  // State to store the item details
  const [item, setItem] = useState(
    route.params.item || { name: "", id: "", image: null }
  );

  // Handle choosing an image for the item
  const handleChooseImage = () => {
    const options = {
      title: "Select Item Image",
      storageOptions: {
        skipBackup: true,
        path: "images",
      },
    };

    ImagePicker.launchCamera(options, (response) => {
      try {
        if (response.didCancel) {
          console.log("Image selection canceled");
        } else if (response.error) {
          console.error("ImagePicker Error: ", response.error);
        } else if (response.uri) {
          setItem({ ...item, image: response.uri });
        }
      } catch (error) {
        console.error("Error when choosing an image: ", error);
      }
    });
  };

  // Save the item data to AsyncStorage
  const saveItem = async () => {
    try {
      let newItem = { ...item, id: Date.now().toString() };
      const existingInventory = await AsyncStorage.getItem("inventory");
      let updatedInventory = [];
      if (existingInventory) {
        updatedInventory = JSON.parse(existingInventory);
      }
      updatedInventory.push(newItem);
      await AsyncStorage.setItem("inventory", JSON.stringify(updatedInventory));
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Item Detail</Text>
      <TextInput
        placeholder="Item Name"
        value={item.name}
        onChangeText={(text) => setItem({ ...item, name: text })}
        style={styles.button}
      />
      <TouchableOpacity style={styles.button} onPress={handleChooseImage}>
        <Text style={styles.buttonText}>Choose Image</Text>
      </TouchableOpacity>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} />
      )}
      <TouchableOpacity style={styles.button} onPress={saveItem}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

// ItemImageDetailScreen: Displays a full-sized image of an item
function ItemImageDetailScreen({ route }) {
  const image = route.params.image;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Full-sized Image</Text>
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}

// App component sets up navigation and screens
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Personal Inventory" component={HomeScreen} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen
          name="ItemImageDetail"
          component={ItemImageDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
