// Initial code base from provided in class INFT3075

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Pressable, Text, Image, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import base64 from 'react-native-base64';
import RNPickerSelect from 'react-native-picker-select';

const Stack = createNativeStackNavigator();
const host = 'https://nscc-0304263-wordpress-thewavenews.azurewebsites.net/';
const username = 'W0219156';
const password = 'ik1b wKbF rCBd cLk2 LSNR ECcg';

function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);

  const getPosts = async () => {
    const result = await fetch(`${host}/wp-json/wp/v2/posts?_fields=id,title,_links&_embed=author,wp:featuredmedia`);
    const data = await result.json();
    setPosts(data);
  };

  React.useEffect(() => {
    getPosts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>The Wave</Text>
      <Pressable onPress={() => navigation.navigate('Create')} style={styles.button}>
        <Text style={styles.buttonText}>Add New Photo</Text>
      </Pressable>
      <ScrollView style={{ marginTop: 10 }}>
        {posts.map(post => (
          <View key={post.id} style={{ marginTop: 10, alignItems: 'center' }}>
            {post._embedded['wp:featuredmedia'] && (
              <Image source={{ uri: post._embedded['wp:featuredmedia'][0].source_url }} style={styles.image} />
            )}
            <Text>{post.title.rendered}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function CreateScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result);
    }
  };

  const uploadPhoto = async () => {
    const uri = image.uri;
    const fileType = uri.substring(uri.lastIndexOf(".") + 1);
    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });

    const response = await fetch(`${host}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + base64.encode(`${username}:${password}`),
        'Content-Disposition': 'attachment; filename=photo.' + fileType,
      },
      body: formData,
    });

    const data = await response.json();
    return data.id;
  };

  // Check for missing information
  const submitPost = async () => {
    if (!title || !content || !image || !category) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const mediaId = await uploadPhoto();
      const response = await fetch(`${host}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + base64.encode(`${username}:${password}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: content,
          status: 'publish',
          categories: [category],
          featured_media: mediaId,
        }),
      });

      const data = await response.json();
      if (data.id) {
        Alert.alert('Success', 'Your article has been posted.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'An error occurred while creating the post.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'An error occurred while creating the post.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Content" value={content} onChangeText={setContent} multiline />
      <RNPickerSelect
        onValueChange={(value) => setCategory(value)}
        items={[
          { label: 'Arts + Music', value: '3' },
          { label: 'Events', value: '6' },
          { label: 'Food + Drink', value: '4' },
          { label: 'Opinion', value: '5' },
          { label: 'Uncategorized', value: '1' },
        ]}
        style={pickerSelectStyles}
        placeholder={{ label: 'Select a category...', value: null }}
      />
      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Pick a Photo</Text>
      </Pressable>
      {image && <Image source={{ uri: image.uri }} style={styles.imagePreview} />}
      <Pressable onPress={submitPost} style={styles.button} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Publishing...' : 'Publish Article'}</Text>
      </Pressable>
      {isLoading && <ActivityIndicator />}
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'The Wave' }} />
        <Stack.Screen name="Create" component={CreateScreen} options={{ title: 'Create New Article' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 15,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginBottom: 15,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 20,
    width: '100%',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 20,
    width: '100%',
  },
});
