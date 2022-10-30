const loadingController = (() => {
   const backdrop = document.querySelector(".backdrop");
   const spinner = document.querySelector(".spinner");
   let loadingContinue = false;
   function showLoading() {
      loadingContinue = true;
      setTimeout(() => {
         if (loadingContinue) {
            backdrop.classList.remove("backdrop-close");
            spinner.style.display = "block";
         }
      }, 1000);
   }
   function hideLoading() {
      loadingContinue = false;
      backdrop.classList.add("backdrop-close");
      spinner.style.display = "none";
   }
   return {
      showLoading,
      hideLoading,
   };
})();

const ajaxController = ((loading) => {


   async function getUser(userId) {
      loading.showLoading();
      const response = await axios("https://dummyjson.com/users/" + userId);
      loading.hideLoading();
      return response.data;
   }

   async function getTweets(count) {
      loading.showLoading();
      const url = "https://dummyjson.com/posts";
      const response = await axios.get(url, {
         params: {
            limit: count,
         },
      });
      loading.hideLoading();
      return response.data.posts;
   }

   async function deleteTweet(tweetId) {
      loadingController.showLoading();
      const response = await axios.delete(
         "https://dummyjson.com/posts/" + tweetId
      );
      loadingController.hideLoading();
      return response.data;
   }

   async function editTweet(tweetId, title, body, userId) {
      loadingController.showLoading();
      const url = 'https://dummyjson.com/posts/' + tweetId
      const response = await axios.put(url, {title: title, body: body})
      loadingController.hideLoading();
      return response.data
   }

   async function createTweet(userId, title, body) {
      
   }

   return {
      getTweets,
      getUser,
      deleteTweet,
      editTweet,
   };
})(loadingController);

const uiController = (() => {
   const userName = document.querySelector(".user-name");
   const userImage = document.querySelector(".user-photo img");
   const posts = document.querySelector(".posts");
   const titleInput = document.querySelector('#title-input')
   const bodyInput = document.querySelector('#body-input')
   const addPost = document.querySelector('.add-post')
   const DEFAULT_FORM_COLOR = 'rgb(236, 236, 236)';
   const EDIT_FORM_COLOR = 'rgb(58, 209, 76)';

   function changeUserName(name) {
      userName.textContent = name;
   }
   function changeUserImage(source) {
      userImage.src = source;
   }

   function addTweet(id, imageSource, name, title, body, userId) {
      const tweetHTML = `
        <div id="user-${userId}" class="user-info">
            <div class="image"><img src="${imageSource}" alt=""></div>
            <div class="name">${name}</div>
        </div>
        <div class="content">
            <div id="title-${id}" class="title">${title}</div>
            <div id="body-${id}" class="body">${body}</div>
        </div>
        <div class="post-settings">
            <i tweet-id="${id}" class="fa-solid fa-pen edit-button"></i>
            <i tweet-id="${id}" class="fa-solid fa-trash delete-button"></i>
        </div>
        `;
      const postElement = document.createElement("div");
      postElement.id = 'tweet-' + id;
      postElement.classList.add("post");
      postElement.innerHTML = tweetHTML;
      posts.appendChild(postElement);
   }

   function deleteTweet(tweetId) {
      const tweetElement = document.querySelector('#tweet-' + tweetId);
      console.log(tweetElement)
      tweetElement.remove();
   }

   function addEventToPostsElement(eventType, callback) {
      posts.addEventListener(eventType, callback);
   }

   function addSubmitEvent(callback) {
      titleInput.addEventListener('keyup', callback)
      bodyInput.addEventListener('keyup', callback)
   }

   function getFormData() {
      return {
         title: titleInput.value,
         body: bodyInput.value
      }
   }

   function getTweetData(tweetId) {
      const titleText = document.querySelector('#title-'+tweetId).textContent
      const bodyText = document.querySelector('#body-'+tweetId).textContent
      const userId = document.querySelector('#user-'+tweetId).textContent
      return {bodyText, titleText, userId}
   }

   function setEditMode(titleText, bodyText) {
      window.scrollTo(0, 0);
      addPost.style.backgroundColor = EDIT_FORM_COLOR;
      titleInput.value = titleText
      bodyInput.value = bodyText
      bodyInput.focus()
   }

   function disableEditMode() {
      addPost.style.backgroundColor = DEFAULT_FORM_COLOR;
      titleInput.value = '';
      bodyInput.value = '';
   }

   return { 
      changeUserImage, 
      changeUserName, 
      addTweet, 
      addEventToPostsElement,
      deleteTweet,
      addSubmitEvent,
      getFormData,
      setEditMode,
      disableEditMode,
      getTweetData
   };
})();

const generalController = ((ajaxController, uiController) => {
   let tweetIdToEdit = null;
   const currentUserId = 1
   
   async function loadUserInfo() {
      const userInfo = await ajaxController.getUser(currentUserId);
      const { firstName, lastName, image } = userInfo;
      uiController.changeUserImage(image);
      uiController.changeUserName(firstName + " " + lastName);
   }

   async function loadTweets(count = 5) {
      const tweets = await ajaxController.getTweets(count);
      for (let tweet of tweets) {
         const { userId, id, title, body } = tweet;
         const { firstName, lastName, image } = await ajaxController.getUser(
            userId
         );
         const fullName = firstName + " " + lastName;
         uiController.addTweet(id, image, fullName, title, body, userId);
      }
   }

   async function deleteTweet(tweetId) {
      await ajaxController.deleteTweet(tweetId);
      uiController.deleteTweet(tweetId)
   }

   async function startEditMode(tweetId) {
      const {titleText, bodyText} = uiController.getTweetData(tweetId)
      uiController.setEditMode(titleText, bodyText)
      tweetIdToEdit = tweetId
   }

   function postsClickHandler(event) {
      const target = event.target;
      if (target.classList.contains("delete-button")) {
         const tweetId = Number(target.getAttribute("tweet-id"));
         deleteTweet(tweetId);
      } else if (target.classList.contains('edit-button')) {
         const tweetId = Number(target.getAttribute("tweet-id"));
         startEditMode(tweetId)
      }
   }

   async function addTweet() {

   }

   async function editTweet() {
      const {titleText, bodyText, userId} = uiController.getTweetData(tweetIdToEdit)
      await ajaxController.editTweet(tweetIdToEdit, titleText, bodyText, userId)
   }

   function submitHandler(event) {
      if (event.code === 'Escape') {
         uiController.disableEditMode()
         tweetIdToEdit = null;
      } else if (event.code === 'Enter') {
         if (tweetIdToEdit) {
            editTweet()
         } else {
            addTweet()
         }
      }
   }

   async function init() {
      await loadUserInfo();
      await loadTweets();
      uiController.addEventToPostsElement("click", postsClickHandler);
      uiController.addSubmitEvent(submitHandler)
   }

   return { init };
})(ajaxController, uiController);

// const eventHandler = (() => {

//    function
// })(generalController, ajaxController, uiController)

generalController.init();
